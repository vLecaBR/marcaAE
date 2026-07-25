using System.Data;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Bookings;
using MarcaAi.Application.Features.Google;
using MarcaAi.Application.Features.Notifications;
using MarcaAi.Application.Scheduling;
using MarcaAi.Domain.Entities;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Infrastructure.Bookings;

/// <summary>
/// Core do agendamento (v1 enxuta): valida evento + duração e cria a consulta sob proteção
/// pessimista anti double-booking.
///
/// Concorrência (decisão firmada): isolamento PADRÃO Read Committed + SELECT ... FOR UPDATE
/// SKIP LOCKED (via IBookingConcurrencyGuard) DENTRO da mesma transação do INSERT.
///
/// Fora do escopo desta fatia: PIX, Google Calendar, e-mail/WhatsApp e recorrência
/// (serão adicionados como camadas seguintes).
/// </summary>
public sealed class BookingService(
    ApplicationDbContext db,
    IBookingConcurrencyGuard guard,
    IGoogleCalendarService google,
    INotificationService notify) : IBookingService
{
    public async Task<CreateBookingResult> CreateAsync(
        CreateBookingRequest request, CancellationToken cancellationToken = default)
    {
        var startUtc = request.StartTimeUtc.UtcDateTime;
        var endUtc = request.EndTimeUtc.UtcDateTime;

        var eventType = await db.EventTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                e => e.Id == request.EventTypeId && e.UserId == request.OwnerId && e.IsActive,
                cancellationToken);

        if (eventType is null)
            return CreateBookingResult.EventNotFound();

        var requestedMinutes = (int)Math.Round((endUtc - startUtc).TotalMinutes);
        if (requestedMinutes != eventType.Duration)
            return CreateBookingResult.InvalidDuration(eventType.Duration);

        // Validação de disponibilidade: o horário precisa cair numa janela da agenda.
        var schedule = await db.Schedules.AsNoTracking()
            .Include(s => s.Availabilities)
            .Include(s => s.Exceptions)
            .FirstOrDefaultAsync(s => s.UserId == request.OwnerId && s.IsDefault, cancellationToken);
        if (schedule is null)
            return CreateBookingResult.EventNotFound();

        var scheduleData = new ScheduleData(
            schedule.TimeZone,
            schedule.Availabilities.Select(a => new AvailabilityRule(a.DayOfWeek, a.StartTime, a.EndTime)).ToList(),
            schedule.Exceptions.Select(x => new ScheduleExceptionData(x.Date, x.Type.ToString(), x.StartTime, x.EndTime)).ToList());

        var windows = AvailabilityCalculator.BuildAvailableWindows(
            scheduleData, startUtc.Date.AddDays(-1), startUtc.Date.AddDays(1).AddSeconds(-1));

        var fitsWindow = windows.Any(d => d.Windows.Any(w => startUtc >= w.Start && endUtc <= w.End));
        if (!fitsWindow)
            return CreateBookingResult.Unavailable();

        var status = eventType.RequiresConfirm ? BookingStatus.PENDING : BookingStatus.CONFIRMED;

        var booking = new Domain.Entities.Booking
        {
            UserId = request.OwnerId,
            EventTypeId = request.EventTypeId,
            GuestName = request.GuestName,
            GuestEmail = request.GuestEmail,
            GuestPhone = request.GuestPhone,
            GuestNotes = request.GuestNotes,
            StartTime = startUtc,
            EndTime = endUtc,
            GuestTimeZone = request.GuestTimeZone,
            Status = status,
            PaymentStatus = PaymentStatus.UNPAID,
        };

        // Transação explícita (Read Committed) — escopo FECHADO antes de qualquer chamada externa,
        // para o refresh de token do Google não colidir com a transação já commitada.
        await using (var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken))
        {
            // Trava pessimista SKIP LOCKED antes de inserir.
            if (await guard.HasConflictAsync(request.OwnerId, startUtc, endUtc, cancellationToken))
            {
                await tx.RollbackAsync(cancellationToken);
                return CreateBookingResult.Conflict();
            }

            db.Bookings.Add(booking);
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }

        // ── Google Calendar (best-effort, fora da transação) ─────────────────
        // Se o Google falhar, NÃO desfazemos a consulta (não pode se perder). Apenas logamos.
        string? meetingUrl = eventType.LocationValue;
        if (status == BookingStatus.CONFIRMED)
        {
            try
            {
                var ev = await google.CreateEventAsync(new CreateGoogleEventInput(
                    UserId: request.OwnerId,
                    Title: $"{eventType.Title} com {request.GuestName}",
                    Description: $"Agendamento via MarcaAí\nPaciente: {request.GuestName} ({request.GuestEmail})\nObservações: {request.GuestNotes ?? "—"}",
                    StartUtc: startUtc,
                    EndUtc: endUtc,
                    GuestName: request.GuestName,
                    GuestEmail: request.GuestEmail,
                    CreateMeetLink: eventType.LocationType == LocationType.GOOGLE_MEET), cancellationToken);

                if (ev is not null)
                {
                    booking.MeetingId = ev.EventId;
                    booking.MeetingUrl = ev.MeetLink ?? meetingUrl;
                    meetingUrl = booking.MeetingUrl;
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
            catch
            {
                // best-effort — a consulta permanece criada mesmo se o Google falhar.
            }
        }

        // ── Notificações (e-mail + WhatsApp, best-effort) ────────────────────
        try
        {
            var owner = await db.Users.AsNoTracking()
                .Where(u => u.Id == request.OwnerId)
                .Select(u => new { u.Name, u.Email, u.TimeZone })
                .FirstOrDefaultAsync(cancellationToken);

            if (owner is not null)
            {
                await notify.NotifyBookingCreatedAsync(new BookingNotification(
                    booking.Uid, booking.GuestName, booking.GuestEmail, booking.GuestPhone,
                    owner.Name ?? "Profissional", owner.Email,
                    eventType.Title, startUtc, endUtc,
                    request.GuestTimeZone, owner.TimeZone,
                    eventType.LocationType, meetingUrl, eventType.RequiresConfirm),
                    cancellationToken);
            }
        }
        catch { /* notificação é best-effort */ }

        return CreateBookingResult.Success(new BookingConfirmationDto(
            booking.Uid,
            booking.StartTime,
            booking.EndTime,
            status.ToString(),
            eventType.RequiresConfirm,
            eventType.Title,
            meetingUrl));
    }

    public async Task<CancelBookingResult> CancelAsync(
        string uid, string? reason, string? canceledBy, CancellationToken cancellationToken = default)
    {
        var booking = await db.Bookings
            .Include(b => b.EventType)
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Uid == uid, cancellationToken);
        if (booking is null)
            return new CancelBookingResult(CancelOutcome.NotFound, "Agendamento não encontrado.");
        if (booking.Status == BookingStatus.CANCELLED)
            return new CancelBookingResult(CancelOutcome.AlreadyCancelled, "Agendamento já está cancelado.");

        var by = string.Equals(canceledBy, "OWNER", StringComparison.OrdinalIgnoreCase)
            ? CanceledBy.OWNER
            : CanceledBy.GUEST;

        booking.Status = BookingStatus.CANCELLED;
        booking.CancelReason = reason;
        booking.CanceledAt = DateTime.UtcNow;
        booking.CanceledBy = by;
        await db.SaveChangesAsync(cancellationToken);

        // Remove o evento do Google Calendar (best-effort).
        if (!string.IsNullOrWhiteSpace(booking.MeetingId))
        {
            try { await google.DeleteEventAsync(booking.UserId, booking.MeetingId!, cancellationToken); }
            catch { /* best-effort */ }
        }

        // Notifica o cancelamento (best-effort).
        try
        {
            await notify.NotifyBookingCancelledAsync(new BookingNotification(
                booking.Uid, booking.GuestName, booking.GuestEmail, booking.GuestPhone,
                booking.Owner.Name ?? "Profissional", booking.Owner.Email,
                booking.EventType.Title, booking.StartTime, booking.EndTime,
                booking.GuestTimeZone, booking.Owner.TimeZone,
                booking.EventType.LocationType, booking.MeetingUrl, booking.EventType.RequiresConfirm),
                reason, cancellationToken);
        }
        catch { /* best-effort */ }

        return new CancelBookingResult(CancelOutcome.Success);
    }
}
