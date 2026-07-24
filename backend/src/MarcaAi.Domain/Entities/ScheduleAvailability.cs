namespace MarcaAi.Domain.Entities;

/// <summary>Janela recorrente por dia da semana (0=domingo..6=sábado). Tabela "schedule_availabilities".</summary>
public class ScheduleAvailability
{
    public string Id { get; set; } = default!;
    public string ScheduleId { get; set; } = default!;
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = default!;  // "HH:mm"
    public string EndTime { get; set; } = default!;    // "HH:mm"

    public Schedule Schedule { get; set; } = default!;
}
