namespace MarcaAi.Application.Features.Auth;

/// <summary>Par de tokens emitidos no login.</summary>
public sealed record AuthTokens(
    string AccessToken,  DateTimeOffset AccessExpiresAt,
    string RefreshToken, DateTimeOffset RefreshExpiresAt);
