using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarcaAi.Api.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public sealed class BookingsController(IBookingService bookings) : ControllerBase
{
    /// <summary>
    /// Agenda uma consulta/sessão (fluxo público do paciente).
    /// Protegido contra double-booking via FOR UPDATE SKIP LOCKED.
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<BookingConfirmationDto>> Create(
        [FromBody] CreateBookingRequest request, CancellationToken ct)
    {
        var result = await bookings.CreateAsync(request, ct);

        return result.Outcome switch
        {
            BookingOutcome.Success =>
                CreatedAtAction(nameof(Create), new { uid = result.Data!.Uid }, result.Data),
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
}
