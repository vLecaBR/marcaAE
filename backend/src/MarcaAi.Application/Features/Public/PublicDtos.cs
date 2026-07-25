using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.Public;

public sealed record PublicEventTypeDto(
    string Id, string Title, string Slug, string? Description,
    int Duration, EventTypeColor Color, LocationType LocationType, int? Price, string Currency);

public sealed record PublicProfileDto(
    string Username,
    string? Name,
    string? Bio,
    string? Image,
    string? BrandColor,
    Theme Theme,
    string TimeZone,
    IReadOnlyList<PublicEventTypeDto> EventTypes);
