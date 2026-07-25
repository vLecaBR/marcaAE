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

    // --- Planos / rateio SaaS (Fase 4; modelado agora p/ migration unificada). Ver spec §5.5. ---
    /// <summary>Código do plano contratado: "solo" | "clinica" | "pro". Null enquanto não mapeado.</summary>
    public string? PlanCode { get; set; }
    /// <summary>Número de profissionais (assentos) da assinatura.</summary>
    public int Quantity { get; set; } = 1;
    /// <summary>Taxa de split padrão herdada do plano, em basis points. Alimenta a fee quando a PayoutAccount não tem override.</summary>
    public int? DefaultFeeBps { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Team Team { get; set; } = default!;
}
