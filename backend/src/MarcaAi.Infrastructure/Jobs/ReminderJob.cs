using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Notifications;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Jobs;

/// <summary>
/// Job recorrente (Hangfire): envia lembretes das consultas CONFIRMED que começam nas próximas
/// 2 horas e ainda não foram lembradas. Marca reminderSent=true. Porte do cron/reminders do Next.
/// </summary>
public sealed class ReminderJob(
    ApplicationDbContext db, INotificationService notify, ILogger<ReminderJob> logger) : IReminderJob
{
    public async Task DispatchDueAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var until = now.AddHours(2);

        var due = await db.Bookings
            .Include(b => b.EventType)
            .Include(b => b.Owner)
            .Where(b => b.Status == BookingStatus.CONFIRMED
                        && !b.ReminderSent
                        && b.StartTime >= now && b.StartTime <= until)
            .Take(50)
            .ToListAsync(cancellationToken);

        if (due.Count == 0) return;

        foreach (var b in due)
        {
            var n = new BookingNotification(
                b.Uid, b.GuestName, b.GuestEmail, b.GuestPhone,
                b.Owner.Name ?? "Profissional", b.Owner.Email,
                b.EventType.Title, b.StartTime, b.EndTime,
                b.GuestTimeZone, b.Owner.TimeZone, b.MeetingUrl, b.EventType.RequiresConfirm);

            await notify.NotifyBookingReminderAsync(n, cancellationToken);
            b.ReminderSent = true;
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("[Reminder] {Count} lembrete(s) enviado(s).", due.Count);
    }
}
