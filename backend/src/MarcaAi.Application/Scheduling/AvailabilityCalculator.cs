namespace MarcaAi.Application.Scheduling;

/// <summary>
/// Calcula as janelas de disponibilidade (UTC) por dia, aplicando regras recorrentes
/// e exceções (BLOCKED/VACATION/OVERRIDE). Porte fiel de lib/scheduling/availability.ts.
/// Função pura — sem acesso a banco.
/// </summary>
public static class AvailabilityCalculator
{
    public static List<DayAvailability> BuildAvailableWindows(ScheduleData schedule, DateTime fromUtc, DateTime toUtc)
    {
        var days = TimeUtils.EachDayBetween(fromUtc, toUtc, schedule.TimeZone);
        var result = new List<DayAvailability>();

        foreach (var day in days)
        {
            var dow = TimeUtils.DayOfWeekInZone(day, schedule.TimeZone);

            var rules = schedule.Availabilities.Where(a => a.DayOfWeek == dow).ToList();
            if (rules.Count == 0) continue; // sem disponibilidade neste dia da semana

            var localDate = TimeUtils.LocalDate(day, schedule.TimeZone);
            var dayExceptions = schedule.Exceptions.Where(ex => ex.Date == localDate).ToList();

            // Dia inteiramente bloqueado (bloqueio/férias sem horário) → pula
            if (dayExceptions.Any(ex => ex.Type is "BLOCKED" or "VACATION" && ex.StartTime is null))
                continue;

            var windows = rules
                .Select(r => new TimeRange(
                    TimeUtils.BuildUtcDateTime(day, r.StartTime, schedule.TimeZone),
                    TimeUtils.BuildUtcDateTime(day, r.EndTime, schedule.TimeZone)))
                .ToList();

            // Bloqueios parciais (com horário) → fragmenta as janelas
            var partials = dayExceptions
                .Where(ex => ex.Type is "BLOCKED" or "VACATION" && ex.StartTime != null && ex.EndTime != null);

            foreach (var block in partials)
            {
                var bs = TimeUtils.BuildUtcDateTime(day, block.StartTime!, schedule.TimeZone);
                var be = TimeUtils.BuildUtcDateTime(day, block.EndTime!, schedule.TimeZone);

                windows = windows.SelectMany(w =>
                {
                    if (!TimeUtils.RangesOverlap(w.Start, w.End, bs, be))
                        return new[] { w };

                    var frags = new List<TimeRange>();
                    if (w.Start < bs) frags.Add(new TimeRange(w.Start, bs));
                    if (w.End > be) frags.Add(new TimeRange(be, w.End));
                    return frags.ToArray();
                }).ToList();
            }

            // OVERRIDE: se houver, substitui as janelas do dia
            if (dayExceptions.Any(ex => ex.Type == "OVERRIDE"))
            {
                windows = dayExceptions
                    .Where(ex => ex.Type == "OVERRIDE" && ex.StartTime != null && ex.EndTime != null)
                    .Select(ex => new TimeRange(
                        TimeUtils.BuildUtcDateTime(day, ex.StartTime!, schedule.TimeZone),
                        TimeUtils.BuildUtcDateTime(day, ex.EndTime!, schedule.TimeZone)))
                    .ToList();
            }

            if (windows.Count == 0) continue;
            result.Add(new DayAvailability(day, dow, windows));
        }

        return result;
    }
}
