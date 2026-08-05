namespace MarcaAi.Application.Features.Auth;

/// <summary>Dados do usuário autenticado (derivados das claims do token).</summary>
public sealed record MeDto
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    /// <summary>Nome de exibição (ex.: "Dr teste"). Distinto de <see cref="Username"/> (handle da URL).</summary>
    public string? Name { get; init; }
    public string? Username { get; init; }
    public bool Onboarded { get; init; }
    public required string TimeZone { get; init; }
}
