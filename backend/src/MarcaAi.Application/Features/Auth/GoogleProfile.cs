namespace MarcaAi.Application.Features.Auth;

/// <summary>Perfil + tokens retornados pelo OAuth do Google, para provisionar usuário/conta.</summary>
public sealed record GoogleProfile(
    string Email,
    string? Name,
    string GoogleUserId,
    string? AccessToken,
    string? RefreshToken,
    long? ExpiresAtUnix,
    string? Scope);
