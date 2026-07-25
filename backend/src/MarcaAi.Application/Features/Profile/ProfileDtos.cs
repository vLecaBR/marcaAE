namespace MarcaAi.Application.Features.Profile;

/// <summary>Atualização do perfil do profissional (dashboard/onboarding).</summary>
public sealed record UpdateProfileInput(
    string? Name,
    string Username,
    string TimeZone,
    string? Bio,
    string? Theme,        // DARK | LIGHT | SYSTEM
    string? BrandColor);
