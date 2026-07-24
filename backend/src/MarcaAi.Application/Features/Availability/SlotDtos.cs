namespace MarcaAi.Application.Features.Availability;

public sealed record SlotDto(DateTime StartUtc, DateTime EndUtc);

public sealed record SlotsResult(IReadOnlyList<SlotDto> Slots);
