namespace MarcaAi.Domain.Entities;

/// <summary>Conta OAuth (Google) — armazena tokens de acesso/refresh. Tabela "accounts".</summary>
public class Account
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string Type { get; set; } = default!;
    public string Provider { get; set; } = default!;
    public string ProviderAccountId { get; set; } = default!;
    public string? RefreshToken { get; set; }
    public string? AccessToken { get; set; }
    public int? ExpiresAt { get; set; }
    public string? TokenType { get; set; }
    public string? Scope { get; set; }
    public string? IdToken { get; set; }
    public string? SessionState { get; set; }

    public User User { get; set; } = default!;
}
