using MarcaAi.Domain.Enums;

namespace MarcaAi.Domain.Entities;

/// <summary>Clínica / equipe. Tabela "teams".</summary>
public class Team
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Description { get; set; }
    public string? Logo { get; set; }
    public Theme Theme { get; set; } = Theme.DARK;
    public string? BrandColor { get; set; } = "#7c3aed";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<EventType> EventTypes { get; set; } = new List<EventType>();
    public Subscription? Subscription { get; set; }
}
