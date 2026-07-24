using MarcaAi.Application.Features.Availability;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Disponibilidade pública: slots de um profissional para um tipo de consulta.</summary>
public interface IAvailabilityService
{
    /// <summary>Retorna os slots disponíveis para a data (no fuso do viewer). Null se evento/agenda inexistente.</summary>
    Task<SlotsResult?> GetSlotsForDateAsync(
        string ownerId, string eventTypeId, DateOnly date, string viewerTimeZone,
        CancellationToken cancellationToken = default);
}
