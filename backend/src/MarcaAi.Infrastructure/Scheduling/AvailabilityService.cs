using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Availability;
using MarcaAi.Application.Scheduling;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Infrastructure.Scheduling;

/// <summary>
/// Orquestra o cálculo de disponibilidade: busca evento, agenda default e agendamentos,
/// monta o ScheduleData e delega para os calculadores puros da Application.
///
/// Fora do escopo desta fatia: FreeBusy do Google Calendar (será unido aos conflitos
/// quando o Google for reativado).
/// </summary>
public sealed class AvailabilityService(ApplicationDbContext db) : IAvailabilityService
{
    public async Task<SlotsResult?> GetSlotsForDateAsync(
        string ownerId, string eventTypeId, DateOnly date, string viewerTimeZone,
        CancellationToken cancellationToken = default)
    {
        var eventType = await db.EventTypes.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == eventTypeId && e.UserId == ownerId && e.IsActive, cancellationToken);
        if (eventType is null) return null;

        var schedule = await db.Schedules.AsNoTracking()
            .Include(s => s.Availabilities)
            .Include(s => s.Exceptions)
            .FirstOrDefaultAsync(s => s.UserId == ownerId && s.IsDefault, cancellationToken);
        if (schedule is null) return null;

        // Verificamos de D-1 até D+1 para cobrir bordas de fuso (igual ao Next).
        var dayMidUtc = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var fromUtc = dayMidUtc.AddDays(-1);
        var toUtc = dayMidUtc.AddDays(1).AddSeconds(-1);

        var bookings = await db.Bookings.AsNoTracking()
            .Where(b => b.UserId == ownerId
                && (b.Status == BookingStatus.CONFIRMED || b.Status == BookingStatus.PENDING)
                && b.StartTime < toUtc && b.EndTime > fromUtc)
            .Select(b => new BookingConflict(b.StartTime, b.EndTime))
            .ToListAsync(cancellationToken);

        var scheduleData = new ScheduleData(
            schedule.TimeZone,
            schedule.Availabilities
                .Select(a => new AvailabilityRule(a.DayOfWeek, a.StartTime, a.EndTime)).ToList(),
            schedule.Exceptions
                .Select(x => new ScheduleExceptionData(x.Date, x.Type.ToString(), x.StartTime, x.EndTime)).ToList());

        var windows = AvailabilityCalculator.BuildAvailableWindows(scheduleData, fromUtc, toUtc);

        var input = new SlotInput(
            eventType.Duration, eventType.BeforeEventBuffer, eventType.AfterEventBuffer,
            fromUtc, toUtc, viewerTimeZone, eventType.BookingLimitDays);

        var slots = SlotCalculator.ComputeAvailableSlots(windows, bookings, input);

        var grouped = SlotCalculator.GroupByDate(slots, viewerTimeZone);
        var key = date.ToString("yyyy-MM-dd");
        var daySlots = grouped.TryGetValue(key, out var list) ? list : new List<Slot>();

        return new SlotsResult(daySlots.Select(s => new SlotDto(s.StartUtc, s.EndUtc)).ToList());
    }
}
