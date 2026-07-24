using MarcaAi.Domain.Enums;

namespace MarcaAi.Domain.Entities;

/// <summary>Vínculo profissional/secretária ↔ clínica, com papel. Tabela "team_members".</summary>
public class TeamMember
{
    public string Id { get; set; } = default!;
    public string TeamId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public TeamRole Role { get; set; } = TeamRole.MEMBER;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Team Team { get; set; } = default!;
    public User User { get; set; } = default!;
}
