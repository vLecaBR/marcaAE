using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

[ApiController]
[Route("api/v1/exceptions")]
[Authorize]
public sealed class ExceptionsController(IApplicationDbContext db) : ControllerBase
{
    /// <summary>Remove uma exceção da agenda (bloqueio/férias/override).</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var ex = await db.ScheduleExceptions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (ex is null) return NotFound();

        db.ScheduleExceptions.Remove(ex);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
