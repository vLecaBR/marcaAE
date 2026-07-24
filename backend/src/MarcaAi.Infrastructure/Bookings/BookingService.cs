using System.Data;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Bookings;
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
public sealed class BookingService(ApplicationDbContext db, IBookingConcurrencyGuard guard) : IBookingService
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

        // Transação explícita no isolamento padrão (Read Committed).
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        // Trava pessimista: bloqueia linhas concorrentes (SKIP LOCKED) antes de inserir.
        if (await guard.HasConflictAsync(request.OwnerId, startUtc, endUtc, cancellationToken))
        {
            await tx.RollbackAsync(cancellationToken);
            return CreateBookingResult.Conflict();
        }

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

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return CreateBookingResult.Success(new BookingConfirmationDto(
            booking.Uid,
            booking.StartTime,
            booking.EndTime,
            status.ToString(),
            eventType.RequiresConfirm,
            eventType.Title));
    }
}
