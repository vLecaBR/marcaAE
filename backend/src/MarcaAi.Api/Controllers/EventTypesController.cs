using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.EventTypes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

[ApiController]
[Route("api/v1/event-types")]
public sealed class EventTypesController(IApplicationDbContext db) : ControllerBase
{
    /// <summary>
    /// SMOKE TEST: lista tipos de consulta/sessão diretamente do banco.
    /// Valida DI + EF Core + mapeamento de enum + conexão Supabase de ponta a ponta.
    /// [AllowAnonymous] temporário — depois será restrito ao profissional autenticado
    /// (WHERE userId = <usuário do token>), conforme o levantamento de endpoints.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventTypeSummaryDto>>> List(
        CancellationToken cancellationToken)
    {
        var items = await db.EventTypes
            .AsNoTracking()
            .OrderBy(e => e.CreatedAt)
            .Select(e => new EventTypeSummaryDto
            {
                Id = e.Id,
                Title = e.Title,
                Slug = e.Slug,
                Description = e.Description,
                Duration = e.Duration,
                Color = e.Color,                 // enum nativo -> exercita o MapEnum
                IsActive = e.IsActive,
                RequiresConfirm = e.RequiresConfirm,
                LocationType = e.LocationType,    // enum nativo -> exercita o MapEnum
                Price = e.Price,
                Currency = e.Currency,
                BookingCount = e.Bookings.Count(),
            })
            .ToListAsync(cancellationToken);

        return Ok(items);
    }
}
