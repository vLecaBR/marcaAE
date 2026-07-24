namespace MarcaAi.Application.Features.Bookings;

/// <summary>Dados para agendar uma consulta/sessão (fluxo público do paciente).</summary>
public sealed record CreateBookingRequest
{
    public required string OwnerId { get; init; }        // profissional dono da agenda
    public required string EventTypeId { get; init; }
    public required string GuestName { get; init; }      // paciente
    public required string GuestEmail { get; init; }
    public string? GuestPhone { get; init; }
    public string? GuestNotes { get; init; }
    public required DateTimeOffset StartTimeUtc { get; init; }
    public required DateTimeOffset EndTimeUtc { get; init; }
    public required string GuestTimeZone { get; init; }
}
