namespace MarcaAi.Domain.Entities;

/// <summary>Token de verificação — usado pelo Magic Link. Tabela "verification_tokens".</summary>
public class VerificationToken
{
    public string Identifier { get; set; } = default!;
    public string Token { get; set; } = default!;
    public DateTime Expires { get; set; }
}
