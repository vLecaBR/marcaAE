using MarcaAi.Application.Features.Google;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Integração com o Google Calendar do profissional. Todas as operações degradam
/// graciosamente (retornam vazio/null/false) se o usuário não tiver conta Google conectada.
/// </summary>
public interface IGoogleCalendarService
{
    Task<IReadOnlyList<GoogleBusySlot>> GetBusySlotsAsync(
        string userId, DateTime timeMinUtc, DateTime timeMaxUtc, CancellationToken cancellationToken = default);

    Task<GoogleEventResult?> CreateEventAsync(CreateGoogleEventInput input, CancellationToken cancellationToken = default);

    Task<bool> DeleteEventAsync(string userId, string eventId, CancellationToken cancellationToken = default);
}
