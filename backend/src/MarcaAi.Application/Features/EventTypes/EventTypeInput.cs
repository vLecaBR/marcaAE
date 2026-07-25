using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.EventTypes;

/// <summary>Entrada de criação/edição de um tipo de consulta/sessão.</summary>
public sealed record EventTypeInput
{
    public required string Title { get; init; }
    public required string Slug { get; init; }
    public string? Description { get; init; }
    public int Duration { get; init; }
    public EventTypeColor Color { get; init; } = EventTypeColor.VIOLET;
    public bool RequiresConfirm { get; init; }
    public int BeforeEventBuffer { get; init; }
    public int AfterEventBuffer { get; init; }
    public int? BookingLimitDays { get; init; }
    public LocationType LocationType { get; init; } = LocationType.GOOGLE_MEET;
    public string? LocationValue { get; init; }
    public int? Price { get; init; }          // centavos
    public string Currency { get; init; } = "BRL";
}
