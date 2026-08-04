namespace MarcaAi.Application.Features.Billing;

/// <summary>
/// Helpers puros para montar o <see cref="BillingStatusDto"/> a partir do estado bruto de uma
/// assinatura (clínica ou individual). Sem I/O — o serviço fornece uso/limites já resolvidos.
/// </summary>
public static class BillingStatusMapper
{
    /// <summary>Status do provedor (lowercase) → enum do front (uppercase).</summary>
    public static string MapStatus(string? raw) => (raw ?? "").Trim().ToLowerInvariant() switch
    {
        "trialing" => "TRIALING",
        "active" => "ACTIVE",
        "past_due" => "PAST_DUE",
        "canceled" or "cancelled" => "CANCELED",
        _ => "INACTIVE",
    };

    /// <summary>
    /// Plano **efetivo**: só vale o plano da assinatura quando ela está viva (ACTIVE/TRIALING);
    /// caso contrário, cai para o plano free (SOLO). Evita conceder premium a assinatura inativa.
    /// </summary>
    public static (string PlanCode, bool Active) Effective(string? rawStatus, string? planCode)
    {
        var status = MapStatus(rawStatus);
        var live = status is "ACTIVE" or "TRIALING";
        var effective = live && !string.IsNullOrWhiteSpace(planCode)
            ? planCode!.Trim().ToUpperInvariant()
            : PlanCatalog.Solo;
        return (effective, live);
    }

    /// <summary>Estado de trial derivado de `status`/`trialEndsAt`.</summary>
    public static TrialStateDto Trial(string? rawStatus, DateTime? trialEndsAt)
    {
        var isTrialing = MapStatus(rawStatus) == "TRIALING" || (trialEndsAt is { } end && end > DateTime.UtcNow);
        if (!isTrialing || trialEndsAt is null)
            return new TrialStateDto(isTrialing, null, null);

        var days = (int)Math.Ceiling((trialEndsAt.Value - DateTime.UtcNow).TotalDays);
        return new TrialStateDto(true, new DateTimeOffset(DateTime.SpecifyKind(trialEndsAt.Value, DateTimeKind.Utc)), Math.Max(days, 0));
    }

    /// <summary>Limites do plano efetivo como DTO.</summary>
    public static PlanLimitsDto Limits(string planCode)
    {
        var l = PlanCatalog.LimitsFor(planCode);
        return new PlanLimitsDto(l.MaxBookingsPerMonth, l.MaxMembers, l.MaxEventTypes);
    }
}
