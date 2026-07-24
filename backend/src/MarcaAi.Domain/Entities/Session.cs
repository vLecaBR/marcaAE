namespace MarcaAi.Domain.Entities;

/// <summary>Sessão do NextAuth. Mantida por compatibilidade de dados; com JWT stateless
/// pode ser descontinuada (ver README). Tabela "sessions".</summary>
public class Session
{
    public string Id { get; set; } = default!;
    public string SessionToken { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public DateTime Expires { get; set; }

    public User User { get; set; } = default!;
}
