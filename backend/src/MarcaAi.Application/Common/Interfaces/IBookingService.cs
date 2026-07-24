using MarcaAi.Application.Features.Bookings;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Criação de agendamento com proteção anti double-booking.</summary>
public interface IBookingService
{
    Task<CreateBookingResult> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken = default);
}
