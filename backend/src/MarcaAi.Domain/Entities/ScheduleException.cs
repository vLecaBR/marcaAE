using MarcaAi.Domain.Enums;

namespace MarcaAi.Domain.Entities;

/// <summary>Exceção pontual da agenda (bloqueio/férias/override). Tabela "schedule_exceptions".</summary>
public class ScheduleException
{
    public string Id { get; set; } = default!;
    public string ScheduleId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public DateOnly Date { get; set; }                 // coluna @db.Date
    public ExceptionType Type { get; set; } = ExceptionType.BLOCKED;
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }

    public Schedule Schedule { get; set; } = default!;
    public User User { get; set; } = default!;
}
