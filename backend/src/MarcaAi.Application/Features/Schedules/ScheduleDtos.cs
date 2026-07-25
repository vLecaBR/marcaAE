using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.Schedules;

public sealed record AvailabilityItemDto(int DayOfWeek, string StartTime, string EndTime);

public sealed record ExceptionItemDto(
    string Id, DateOnly Date, ExceptionType Type, string? StartTime, string? EndTime, string? Reason);

public sealed record ScheduleDto(
    string Id,
    string Name,
    string TimeZone,
    bool IsDefault,
    IReadOnlyList<AvailabilityItemDto> Availabilities,
    IReadOnlyList<ExceptionItemDto> Exceptions);

/// <summary>Substitui as janelas de disponibilidade da agenda.</summary>
public sealed record SaveAvailabilityInput(
    string? TimeZone,
    IReadOnlyList<AvailabilityItemDto> Availabilities);

/// <summary>Adiciona uma exceção (bloqueio/férias/override) numa data.</summary>
public sealed record AddExceptionInput(
    string Date,          // yyyy-MM-dd
    string? Type,         // BLOCKED (padrão) | VACATION | OVERRIDE
    string? StartTime,    // null = dia inteiro
    string? EndTime,
    string? Reason);
