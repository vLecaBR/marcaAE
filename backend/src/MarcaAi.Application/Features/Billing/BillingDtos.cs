namespace MarcaAi.Application.Features.Billing;

/// <summary>Resultado do início de checkout/portal de assinatura.</summary>
public sealed record CheckoutResult(bool Ok, string? Url = null, string? Error = null, int StatusCode = 200);

/// <summary>Estado do free trial. `TrialEndsAt`/`DaysRemaining` nulos fora de trial.</summary>
public sealed record TrialStateDto(bool IsTrialing, DateTimeOffset? TrialEndsAt, int? DaysRemaining);

/// <summary>Uso corrente do período (sempre agregado no servidor).</summary>
public sealed record PlanUsageDto(int BookingsThisMonth, int MembersCount, int EventTypesCount);

/// <summary>Limites vigentes do plano. `null` = ilimitado.</summary>
public sealed record PlanLimitsDto(int? MaxBookingsPerMonth, int? MaxMembers, int? MaxEventTypes);

/// <summary>
/// Status de billing rico consumido pelo front (`frontend/lib/api/billing-types.ts`): plano
/// **efetivo** (assinatura ativa, senão SOLO), trial, uso e limites reais. Serve tanto para a
/// clínica (`GET /teams/{id}/billing`) quanto para o indivíduo (`GET /user/billing`). Para o
/// indivíduo, `TeamId` vem vazio. `Status` em maiúsculas (TRIALING/ACTIVE/PAST_DUE/CANCELED/INACTIVE).
/// </summary>
public sealed record BillingStatusDto(
    string TeamId,
    string PlanCode,
    string Status,
    bool Active,
    DateTimeOffset? CurrentPeriodEnd,
    TrialStateDto Trial,
    PlanUsageDto Usage,
    PlanLimitsDto Limits);
