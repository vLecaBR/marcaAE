namespace MarcaAi.Domain.Entities;

/// <summary>
/// Assinatura SaaS **individual** (profissional autônomo) via Stripe. Tabela "user_subscriptions".
/// Estrutura deliberadamente **separada** de <see cref="Subscription"/> (clínica): o Solo/Solo Pro
/// tem relação direta (plataforma retém a taxa e repassa ao profissional), sem o split interno de
/// clínica. Ver decisão de produto do Q7 (Ponto Cego #1).
/// </summary>
public class UserSubscription
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;

    public string StripeCustomerId { get; set; } = default!;
    public string? StripeSubscriptionId { get; set; }
    public string? StripePriceId { get; set; }
    public DateTime? StripeCurrentPeriodEnd { get; set; }

    /// <summary>Status do provedor (active/trialing/past_due/canceled/…).</summary>
    public string Status { get; set; } = "active";

    /// <summary>Código do plano individual ("SOLO_PRO"). Null enquanto não mapeado.</summary>
    public string? PlanCode { get; set; }

    /// <summary>Taxa de split herdada do plano, em basis points (Solo Pro = 500 = 5%).</summary>
    public int? DefaultFeeBps { get; set; }

    /// <summary>Fim do período de teste grátis, se houver.</summary>
    public DateTime? TrialEndsAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = default!;
}
