using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Payments;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;

namespace MarcaAi.Infrastructure.Payments;

/// <summary>
/// Split de cartão via Stripe Connect (Destination Charge): cria um PaymentIntent que retém a
/// application fee do MarcaAí e repassa o líquido para a conta conectada do profissional/clínica.
/// Também processa os webhooks do Connect (KYC da conta + baixa/reembolso da cobrança).
/// Chaves lidas de configuração (Stripe:SecretKey / Stripe:ConnectWebhookSecret) — nunca hard-coded.
/// </summary>
public sealed class StripeConnectService(
    ApplicationDbContext db, IConfiguration config, ILogger<StripeConnectService> logger)
    : ISplitPaymentService, IStripeConnectWebhookHandler
{
    public PaymentProvider Provider => PaymentProvider.STRIPE;

    private bool Configured => !string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]);
    private void EnsureKey() => StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

    public async Task<SplitChargeResult?> CreateChargeAsync(SplitChargeRequest request, CancellationToken ct = default)
    {
        if (!Configured) { logger.LogWarning("[StripeConnect] SecretKey ausente — cobrança ignorada."); return null; }
        EnsureKey();

        var options = new PaymentIntentCreateOptions
        {
            Amount = request.GrossCents,
            Currency = request.Currency.ToLowerInvariant(),
            // Destination charge: a taxa do MarcaAí é retida; o restante é transferido à conta conectada.
            ApplicationFeeAmount = request.ApplicationFeeCents,
            TransferData = new PaymentIntentTransferDataOptions { Destination = request.DestinationAccountId },
            // on_behalf_of: a conta conectada é a merchant de liquidação e absorve as taxas do Stripe
            // (AbsorbGatewayCost=false, §10.2). Habilita cartão local/BR na conta do profissional.
            OnBehalfOf = request.DestinationAccountId,
            ReceiptEmail = request.GuestEmail,
            Description = request.Description,
            // Referência para reconciliação e lookup no webhook.
            Metadata = new Dictionary<string, string> { ["bookingUid"] = request.BookingUid },
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
        };

        // Idempotência: retries não geram cobrança duplicada (§9).
        var requestOptions = new RequestOptions { IdempotencyKey = $"charge_{request.BookingUid}" };

        try
        {
            var intent = await new PaymentIntentService().CreateAsync(options, requestOptions, ct);
            return new SplitChargeResult(intent.Id, intent.ClientSecret, intent.Status);
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "[StripeConnect] Falha ao criar PaymentIntent para booking {Uid}", request.BookingUid);
            return null;
        }
    }

    public async Task<RefundResult?> RefundAsync(string providerPaymentId, int? amountCents = null, CancellationToken ct = default)
    {
        if (!Configured) return null;
        EnsureKey();

        var options = new RefundCreateOptions
        {
            PaymentIntent = providerPaymentId,
            // Devolve a application fee proporcionalmente (§10.5).
            RefundApplicationFee = true,
            ReverseTransfer = true,
        };
        if (amountCents is { } amt) options.Amount = amt;

        try
        {
            var refund = await new RefundService().CreateAsync(
                options, new RequestOptions { IdempotencyKey = $"refund_{providerPaymentId}" }, ct);
            return new RefundResult(refund.Id, refund.Status, (int)refund.Amount);
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "[StripeConnect] Falha ao reembolsar {PaymentId}", providerPaymentId);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Webhook do Connect
    // ─────────────────────────────────────────────────────────────────────────
    public async Task HandleConnectWebhookAsync(string payload, string signature, CancellationToken ct = default)
    {
        var secret = config["Stripe:ConnectWebhookSecret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            logger.LogError("[StripeConnect] ConnectWebhookSecret ausente.");
            throw new InvalidOperationException("Webhook do Connect não configurado.");
        }

        Event e;
        try { e = EventUtility.ConstructEvent(payload, signature, secret); }
        catch (StripeException ex) { logger.LogWarning(ex, "[StripeConnect] Assinatura de webhook inválida"); throw; }

        switch (e.Type)
        {
            case "account.updated":
                await OnAccountUpdatedAsync(e.Data.Object as Account, ct);
                break;
            case "payment_intent.succeeded":
                await OnPaymentSucceededAsync(e.Data.Object as PaymentIntent, ct);
                break;
            case "charge.refunded":
                await OnChargeRefundedAsync(e.Data.Object as Charge, ct);
                break;
            default:
                logger.LogDebug("[StripeConnect] Evento não tratado: {Type}", e.Type);
                break;
        }
    }

    /// <summary>KYC da conta conectada → atualiza status/flags da PayoutAccount (idempotente).</summary>
    private async Task OnAccountUpdatedAsync(Account? account, CancellationToken ct)
    {
        if (account is null) return;

        var payout = await db.PayoutAccounts.FirstOrDefaultAsync(
            a => a.Provider == PaymentProvider.STRIPE && a.ExternalAccountId == account.Id, ct);
        if (payout is null)
        {
            logger.LogWarning("[StripeConnect] account.updated sem PayoutAccount para {AccountId}", account.Id);
            return;
        }

        payout.ChargesEnabled = account.ChargesEnabled;
        payout.PayoutsEnabled = account.PayoutsEnabled;
        // ACTIVE apenas quando o provedor libera cobranças e repasses; senão RESTRICTED.
        payout.Status = account is { ChargesEnabled: true, PayoutsEnabled: true }
            ? PayoutAccountStatus.ACTIVE
            : PayoutAccountStatus.RESTRICTED;

        await db.SaveChangesAsync(ct);
    }

    /// <summary>Pagamento aprovado → grava o snapshot financeiro no Booking (imutável após PAID, §9).</summary>
    private async Task OnPaymentSucceededAsync(PaymentIntent? intent, CancellationToken ct)
    {
        if (intent is null) return;
        if (intent.Metadata is null || !intent.Metadata.TryGetValue("bookingUid", out var uid) || string.IsNullOrEmpty(uid))
            return;

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Uid == uid, ct);
        if (booking is null) { logger.LogWarning("[StripeConnect] Booking {Uid} não encontrado", uid); return; }

        // Idempotência: se já está PAID, não reprocessa (evita dupla baixa).
        if (booking.PaymentStatus == PaymentStatus.PAID) return;

        booking.PaymentStatus = PaymentStatus.PAID;
        booking.ProviderPaymentId = intent.Id;
        booking.PaidAt = DateTime.UtcNow;
        booking.PlatformFeeCents ??= (int?)intent.ApplicationFeeAmount;
        if (booking.PriceCents is { } gross && booking.PlatformFeeCents is { } fee)
            booking.NetToProviderCents ??= gross - fee;

        await db.SaveChangesAsync(ct);
    }

    /// <summary>Reembolso → atualiza status e registra a data (total ou parcial).</summary>
    private async Task OnChargeRefundedAsync(Charge? charge, CancellationToken ct)
    {
        if (charge is null || string.IsNullOrEmpty(charge.PaymentIntentId)) return;

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.ProviderPaymentId == charge.PaymentIntentId, ct);
        if (booking is null) return;

        var newStatus = charge.Refunded
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;

        // Idempotência: só grava se mudou.
        if (booking.PaymentStatus == newStatus) return;

        booking.PaymentStatus = newStatus;
        booking.RefundedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
