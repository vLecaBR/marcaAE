namespace MarcaAi.Domain.Entities;

/// <summary>Agenda de disponibilidade do profissional. Tabela "schedules".</summary>
public class Schedule
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string Name { get; set; } = "Agenda Padrão";
    public string TimeZone { get; set; } = default!;
    public bool IsDefault { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = default!;
    public ICollection<ScheduleAvailability> Availabilities { get; set; } = new List<ScheduleAvailability>();
    public ICollection<ScheduleException> Exceptions { get; set; } = new List<ScheduleException>();
}
