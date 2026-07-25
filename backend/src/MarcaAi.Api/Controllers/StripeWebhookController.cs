using MarcaAi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarcaAi.Api.Controllers;

/// <summary>Webhook do Stripe (eventos de assinatura). Autenticação via assinatura do payload.</summary>
[ApiController]
[Route("api/v1/webhooks/stripe")]
[AllowAnonymous]
public sealed class StripeWebhookController(IBillingService billing) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrEmpty(signature))
            return BadRequest("Assinatura ausente.");

        try
        {
            await billing.HandleWebhookAsync(payload, signature, ct);
            return Ok();
        }
        catch (Stripe.StripeException)
        {
            return BadRequest("Assinatura inválida.");
        }
        catch
        {
            // Retorna 500 para o Stripe reenviar.
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
