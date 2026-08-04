using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Billing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarcaAi.Api.Controllers;

/// <summary>Assinatura da clínica (Stripe).</summary>
[ApiController]
[Route("api/v1/teams/{teamId}/billing")]
[Authorize]
public sealed class BillingController(IBillingService billing) : ControllerBase
{
    /// <summary>Inicia checkout (nova) ou portal (existente). Retorna a URL do Stripe.</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(string teamId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var r = await billing.CreateCheckoutAsync(teamId, userId, ct);
        return r.Ok
            ? Ok(new { url = r.Url })
            : Problem(statusCode: r.StatusCode, detail: r.Error);
    }

    /// <summary>Status da assinatura da clínica.</summary>
    [HttpGet]
    public async Task<ActionResult<BillingStatusDto>> Status(string teamId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var status = await billing.GetStatusAsync(teamId, userId, ct);
        return status is null ? NotFound() : Ok(status);
    }
}
