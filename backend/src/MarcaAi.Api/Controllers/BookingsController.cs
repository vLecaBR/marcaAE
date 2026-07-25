using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public sealed class BookingsController(IBookingService bookings, IApplicationDbContext db) : ControllerBase
{
    /// <summary>Agenda uma consulta (fluxo público do paciente). Protegido contra double-booking.</summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<BookingConfirmationDto>> Create(
        [FromBody] CreateBookingRequest request, CancellationToken ct)
    {
        var result = await bookings.CreateAsync(request, ct);
        return result.Outcome switch
        {
            BookingOutcome.Success =>
                CreatedAtAction(nameof(GetByUid), new { uid = result.Data!.Uid }, result.Data),
            BookingOutcome.EventNotFound =>
                Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            BookingOutcome.InvalidDuration =>
                Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: result.Message),
            BookingOutcome.Unavailable =>
                Problem(statusCode: StatusCodes.Status422UnprocessableEntity, detail: result.Message),
            BookingOutcome.Conflict =>
                Problem(statusCode: StatusCodes.Status409Conflict, detail: result.Message),
            _ => Problem(statusCode: StatusCodes.Status500InternalServerError),
        };
    }

    /// <summary>Lista as consultas do profissional autenticado (dashboard). Filtros opcionais.</summary>
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BookingListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to,
        CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var query = db.Bookings.AsNoTracking().Where(b => b.UserId == userId);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<Domain.Enums.BookingStatus>(status, ignoreCase: true, out var st))
            query = query.Where(b => b.Status == st);
        if (from is { } f) query = query.Where(b => b.StartTime >= f.UtcDateTime);
        if (to is { } t) query = query.Where(b => b.StartTime <= t.UtcDateTime);

        var items = await query
            .OrderByDescending(b => b.StartTime)
            .Select(b => new BookingListItemDto(
                b.Uid, b.GuestName, b.GuestEmail, b.GuestPhone,
                b.StartTime, b.EndTime, b.Status, b.EventType.Title,
                b.MeetingUrl, b.PaymentStatus))
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>Detalhe público da consulta (página de confirmação/gerenciamento).</summary>
    [AllowAnonymous]
    [HttpGet("{uid}")]
    public async Task<ActionResult<BookingDetailDto>> GetByUid(string uid, CancellationToken ct)
    {
        var b = await db.Bookings.AsNoTracking()
            .Where(x => x.Uid == uid)
            .Select(x => new BookingDetailDto(
                x.Uid, x.GuestName, x.GuestEmail, x.StartTime, x.EndTime,
                x.Status, x.EventType.Title, x.Owner.Name ?? "Profissional",
                x.MeetingUrl, x.GuestTimeZone))
            .FirstOrDefaultAsync(ct);

        return b is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, detail: "Agendamento não encontrado.")
            : Ok(b);
    }

    /// <summary>Cancela a consulta pelo uid (paciente ou profissional). Remove o evento do Google.</summary>
    [AllowAnonymous]
    [HttpPost("{uid}/cancel")]
    public async Task<IActionResult> Cancel(string uid, [FromBody] CancelBookingRequest? body, CancellationToken ct)
    {
        var result = await bookings.CancelAsync(uid, body?.Reason, body?.CanceledBy, ct);
        return result.Outcome switch
        {
            CancelOutcome.Success => NoContent(),
            CancelOutcome.NotFound => Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            CancelOutcome.AlreadyCancelled => Problem(statusCode: StatusCodes.Status409Conflict, detail: result.Message),
            _ => Problem(statusCode: StatusCodes.Status500InternalServerError),
        };
    }
}
