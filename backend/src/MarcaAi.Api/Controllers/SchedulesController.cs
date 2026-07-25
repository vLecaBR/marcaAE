using System.Globalization;
using System.Text.RegularExpressions;
using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Schedules;
using MarcaAi.Domain.Entities;
using MarcaAi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

/// <summary>Gestão da agenda de disponibilidade do profissional autenticado.</summary>
[ApiController]
[Route("api/v1/schedules")]
[Authorize]
public sealed partial class SchedulesController(IApplicationDbContext db) : ControllerBase
{
    [GeneratedRegex(@"^([01]\d|2[0-3]):[0-5]\d$")]
    private static partial Regex HhmmRegex();

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScheduleDto>>> List(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var schedules = await db.Schedules.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.IsDefault)
            .Select(s => new ScheduleDto(
                s.Id, s.Name, s.TimeZone, s.IsDefault,
                s.Availabilities
                    .OrderBy(a => a.DayOfWeek).ThenBy(a => a.StartTime)
                    .Select(a => new AvailabilityItemDto(a.DayOfWeek, a.StartTime, a.EndTime)).ToList(),
                s.Exceptions
                    .OrderBy(x => x.Date)
                    .Select(x => new ExceptionItemDto(x.Id, x.Date, x.Type, x.StartTime, x.EndTime, x.Reason)).ToList()))
            .ToListAsync(ct);

        return Ok(schedules);
    }

    [HttpPut("{id}/availability")]
    public async Task<IActionResult> SaveAvailability(string id, [FromBody] SaveAvailabilityInput input, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var schedule = await db.Schedules
            .Include(s => s.Availabilities)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);
        if (schedule is null) return NotFound();

        foreach (var a in input.Availabilities)
        {
            if (a.DayOfWeek is < 0 or > 6)
                return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: "dayOfWeek deve ser 0–6.");
            if (!HhmmRegex().IsMatch(a.StartTime) || !HhmmRegex().IsMatch(a.EndTime))
                return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: "Horários devem estar no formato HH:mm.");
            if (string.CompareOrdinal(a.StartTime, a.EndTime) >= 0)
                return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: "startTime deve ser antes de endTime.");
        }

        if (!string.IsNullOrWhiteSpace(input.TimeZone)) schedule.TimeZone = input.TimeZone;

        // Substitui todas as janelas.
        db.ScheduleAvailabilities.RemoveRange(schedule.Availabilities);
        foreach (var a in input.Availabilities)
            schedule.Availabilities.Add(new ScheduleAvailability
            {
                ScheduleId = schedule.Id,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
            });

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id}/exceptions")]
    public async Task<ActionResult<ExceptionItemDto>> AddException(string id, [FromBody] AddExceptionInput input, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var schedule = await db.Schedules.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);
        if (schedule is null) return NotFound();

        if (!DateOnly.TryParseExact(input.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: "Data inválida (use yyyy-MM-dd).");

        var type = Enum.TryParse<ExceptionType>(input.Type, ignoreCase: true, out var t) ? t : ExceptionType.BLOCKED;

        if ((input.StartTime is not null && !HhmmRegex().IsMatch(input.StartTime)) ||
            (input.EndTime is not null && !HhmmRegex().IsMatch(input.EndTime)))
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: "Horários devem estar no formato HH:mm.");

        if (await db.ScheduleExceptions.AnyAsync(x => x.ScheduleId == id && x.Date == date, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Já existe uma exceção para esta data.");

        var ex = new ScheduleException
        {
            ScheduleId = id,
            UserId = userId,
            Date = date,
            Type = type,
            StartTime = input.StartTime,
            EndTime = input.EndTime,
            Reason = input.Reason,
        };
        db.ScheduleExceptions.Add(ex);
        await db.SaveChangesAsync(ct);

        return Ok(new ExceptionItemDto(ex.Id, ex.Date, ex.Type, ex.StartTime, ex.EndTime, ex.Reason));
    }
}
