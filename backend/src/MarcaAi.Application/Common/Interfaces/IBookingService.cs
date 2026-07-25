using MarcaAi.Application.Features.Bookings;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Criação e cancelamento de agendamento.</summary>
public interface IBookingService
{
    Task<CreateBookingResult> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken = default);

    /// <summary>Cancela a consulta pelo uid público e remove o evento do Google (best-effort).</summary>
    Task<CancelBookingResult> CancelAsync(string uid, string? reason, string? canceledBy, CancellationToken cancellationToken = default);
}
