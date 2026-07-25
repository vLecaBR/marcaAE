using System.Text.Json;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

/// <summary>Webhook do Mercado Pago: confirma pagamentos PIX e marca a consulta como PAID.</summary>
[ApiController]
[Route("api/v1/webhooks/mercadopago")]
[AllowAnonymous]
public sealed class MercadoPagoWebhookController(IPixPaymentService pix, IApplicationDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        // O id do pagamento vem em query (data.id / id) ou no corpo { data: { id } }.
        var paymentId = Request.Query["data.id"].FirstOrDefault() ?? Request.Query["id"].FirstOrDefault();

        if (string.IsNullOrEmpty(paymentId))
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync(ct);
            if (!string.IsNullOrWhiteSpace(body))
            {
                try
                {
                    using var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("data", out var data) && data.TryGetProperty("id", out var idEl))
                        paymentId = idEl.ValueKind == JsonValueKind.String ? idEl.GetString() : idEl.GetRawText();
                }
                catch { /* corpo não-JSON: ignora */ }
            }
        }

        if (string.IsNullOrEmpty(paymentId)) return Ok(); // evento sem pagamento — ignora

        var info = await pix.GetPaymentAsync(paymentId, ct);
        if (info is { Status: "approved", ExternalReference: { Length: > 0 } uid })
        {
            var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Uid == uid, ct);
            // Proteção contra double-processing (§9): só grava a baixa uma vez.
            if (booking is not null && booking.PaymentStatus != PaymentStatus.PAID)
            {
                // Snapshot financeiro imutável: as fees/net já foram gravadas na iniciação
                // (BookingPaymentService); aqui confirmamos o pagamento e carimbamos a data/provedor.
                booking.PaymentStatus = PaymentStatus.PAID;
                booking.PaidAt = DateTime.UtcNow;
                booking.PaymentProvider ??= PaymentProvider.MERCADO_PAGO;
                booking.ProviderPaymentId ??= paymentId;
                await db.SaveChangesAsync(ct);
            }
        }

        return Ok();
    }
}
