namespace MarcaAi.Domain.Entities;

/// <summary>Assinatura SaaS da clínica (Stripe). Tabela "subscriptions".</summary>
public class Subscription
{
    public string Id { get; set; } = default!;
    public string TeamId { get; set; } = default!;
    public string StripeCustomerId { get; set; } = default!;
    public string? StripeSubscriptionId { get; set; }
    public string? StripePriceId { get; set; }
    public DateTime? StripeCurrentPeriodEnd { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Team Team { get; set; } = default!;
}
