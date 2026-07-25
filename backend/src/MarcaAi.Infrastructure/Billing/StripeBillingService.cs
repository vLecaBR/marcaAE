using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Billing;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace MarcaAi.Infrastructure.Billing;

/// <summary>
/// Assinatura das clínicas via Stripe: checkout (nova) / portal (existente) + processamento de webhook.
/// Foca no status da assinatura (o que gate features); o período é opcional e best-effort.
/// </summary>
public sealed class StripeBillingService(
    ApplicationDbContext db, IConfiguration config, ILogger<StripeBillingService> logger) : IBillingService
{
    private string AppUrl => (config["App:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');
    private void EnsureKey() => StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

    public async Task<CheckoutResult> CreateCheckoutAsync(string teamId, string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]))
            return new CheckoutResult(false, Error: "Stripe não configurado.", StatusCode: 503);

        var member = await db.TeamMembers.FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId, ct);
        if (member is null) return new CheckoutResult(false, Error: "Equipe não encontrada.", StatusCode: 404);
        if (member.Role != TeamRole.OWNER) return new CheckoutResult(false, Error: "Apenas o dono da clínica pode assinar.", StatusCode: 403);

        var subscription = await db.Subscriptions.FirstOrDefaultAsync(s => s.TeamId == teamId, ct);
        EnsureKey();

        try
        {
            // Já é cliente → abre o portal de gerenciamento.
            if (!string.IsNullOrWhiteSpace(subscription?.StripeCustomerId))
            {
                var portal = await new Stripe.BillingPortal.SessionService().CreateAsync(
                    new Stripe.BillingPortal.SessionCreateOptions
                    {
                        Customer = subscription!.StripeCustomerId,
                        ReturnUrl = $"{AppUrl}/dashboard/teams/{teamId}/billing",
                    }, cancellationToken: ct);
                return new CheckoutResult(true, portal.Url);
            }

            // Nova assinatura → checkout.
            var session = await new SessionService().CreateAsync(new SessionCreateOptions
            {
                Mode = "subscription",
                LineItems = new List<SessionLineItemOptions>
                {
                    new() { Price = config["Stripe:PriceId"], Quantity = 1 },
                },
                SuccessUrl = $"{AppUrl}/dashboard/teams/{teamId}/billing?success=true",
                CancelUrl = $"{AppUrl}/dashboard/teams/{teamId}/billing?canceled=true",
                Metadata = new Dictionary<string, string> { ["teamId"] = teamId },
            }, cancellationToken: ct);

            return new CheckoutResult(true, session.Url);
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "[Stripe] Falha ao criar checkout");
            return new CheckoutResult(false, Error: "Falha ao iniciar o pagamento.", StatusCode: 502);
        }
    }

    public async Task<TeamBillingDto?> GetStatusAsync(string teamId, string userId, CancellationToken ct = default)
    {
        var member = await db.TeamMembers.AsNoTracking()
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId, ct);
        if (member is null) return null;

        var sub = await db.Subscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.TeamId == teamId, ct);
        var status = sub?.Status ?? "none";
        var active = status is "active" or "trialing";
        return new TeamBillingDto(teamId, status, active, sub?.StripeCurrentPeriodEnd);
    }

    public async Task HandleWebhookAsync(string payload, string signature, CancellationToken ct = default)
    {
        var secret = config["Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(secret)) { logger.LogError("[Stripe] WebhookSecret ausente."); throw new InvalidOperationException("Webhook não configurado."); }

        Event e;
        try { e = EventUtility.ConstructEvent(payload, signature, secret); }
        catch (StripeException ex) { logger.LogWarning(ex, "[Stripe] Assinatura de webhook inválida"); throw; }

        EnsureKey();

        switch (e.Type)
        {
            case "checkout.session.completed":
            {
                if (e.Data.Object is not Session session || session.SubscriptionId is null) break;
                if (session.Metadata is null || !session.Metadata.TryGetValue("teamId", out var teamId)) break;
                var sub = await new SubscriptionService().GetAsync(session.SubscriptionId, cancellationToken: ct);
                await UpsertAsync(teamId, sub, ct);
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            {
                if (e.Data.Object is not Subscription sub) break;
                var existing = await db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == sub.Id, ct);
                if (existing is not null)
                {
                    existing.Status = sub.Status;
                    existing.StripePriceId = FirstPriceId(sub) ?? existing.StripePriceId;
                    await db.SaveChangesAsync(ct);
                }
                break;
            }
        }
    }

    private async Task UpsertAsync(string teamId, Subscription sub, CancellationToken ct)
    {
        var existing = await db.Subscriptions.FirstOrDefaultAsync(s => s.TeamId == teamId, ct);
        var customerId = sub.CustomerId ?? "";
        var priceId = FirstPriceId(sub);

        if (existing is null)
        {
            db.Subscriptions.Add(new Domain.Entities.Subscription
            {
                TeamId = teamId,
                StripeCustomerId = customerId,
                StripeSubscriptionId = sub.Id,
                StripePriceId = priceId,
                Status = sub.Status,
            });
        }
        else
        {
            if (!string.IsNullOrEmpty(customerId)) existing.StripeCustomerId = customerId;
            existing.StripeSubscriptionId = sub.Id;
            existing.StripePriceId = priceId;
            existing.Status = sub.Status;
        }
        await db.SaveChangesAsync(ct);
    }

    private static string? FirstPriceId(Subscription sub) =>
        sub.Items?.Data is { Count: > 0 } items ? items[0].Price?.Id : null;
}
