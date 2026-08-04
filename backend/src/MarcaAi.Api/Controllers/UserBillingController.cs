using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Billing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarcaAi.Api.Controllers;

/// <summary>
/// Assinatura **individual** do profissional (Solo / Solo Pro) — Q7. Separada do billing de clínica.
/// </summary>
[ApiController]
[Route("api/v1/user/billing")]
[Authorize]
public sealed class UserBillingController(IUserBillingService billing) : ControllerBase
{
    /// <summary>Status de billing do profissional autenticado (plano efetivo, trial, uso, limites).</summary>
    [HttpGet]
    public async Task<ActionResult<BillingStatusDto>> Status(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await billing.GetStatusAsync(userId, ct));
    }

    /// <summary>Inicia o checkout/portal de um plano individual pago (ex.: SOLO_PRO).</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] UserCheckoutRequest body, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var r = await billing.CreateCheckoutAsync(userId, body.PlanCode ?? "", ct);
        return r.Ok ? Ok(new { url = r.Url }) : Problem(statusCode: r.StatusCode, detail: r.Error);
    }
}

/// <summary>Corpo do checkout individual.</summary>
public sealed record UserCheckoutRequest(string? PlanCode);
