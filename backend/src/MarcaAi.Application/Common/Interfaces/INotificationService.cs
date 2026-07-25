using MarcaAi.Application.Features.Notifications;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Orquestra notificações de consulta (e-mail ao paciente e ao profissional + WhatsApp).</summary>
public interface INotificationService
{
    /// <summary>Consulta criada: confirma (ou avisa pendente, se requer confirmação) o paciente e notifica o profissional.</summary>
    Task NotifyBookingCreatedAsync(BookingNotification n, CancellationToken cancellationToken = default);

    Task NotifyBookingCancelledAsync(BookingNotification n, string? reason, CancellationToken cancellationToken = default);

    Task NotifyBookingReminderAsync(BookingNotification n, CancellationToken cancellationToken = default);
}
