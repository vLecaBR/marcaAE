namespace MarcaAi.Application.Scheduling;

/// <summary>Intervalo de tempo em UTC.</summary>
public sealed record TimeRange(DateTime Start, DateTime End);

/// <summary>Regra recorrente de disponibilidade por dia da semana (0=domingo..6=sábado).</summary>
public sealed record AvailabilityRule(int DayOfWeek, string StartTime, string EndTime); // "HH:mm"

/// <summary>Exceção pontual da agenda (bloqueio/férias/override) numa data específica.</summary>
public sealed record ScheduleExceptionData(DateOnly Date, string Type, string? StartTime, string? EndTime);

/// <summary>Dados de agenda necessários para calcular disponibilidade.</summary>
public sealed record ScheduleData(
    string TimeZone,
    IReadOnlyList<AvailabilityRule> Availabilities,
    IReadOnlyList<ScheduleExceptionData> Exceptions);

/// <summary>Janelas disponíveis (UTC) de um dia.</summary>
public sealed record DayAvailability(DateTime Date, int DayOfWeek, IReadOnlyList<TimeRange> Windows);

/// <summary>Parâmetros de geração de slots.</summary>
public sealed record SlotInput(
    int EventDuration, int BeforeBuffer, int AfterBuffer,
    DateTime DateFrom, DateTime DateTo, string ViewerTimeZone, int? BookingLimitDays);

/// <summary>Slot disponível (UTC).</summary>
public sealed record Slot(DateTime StartUtc, DateTime EndUtc);

/// <summary>Agendamento existente que ocupa a agenda.</summary>
public sealed record BookingConflict(DateTime StartTime, DateTime EndTime);
