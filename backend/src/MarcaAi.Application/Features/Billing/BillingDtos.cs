namespace MarcaAi.Application.Features.Billing;

/// <summary>Resultado do início de checkout/portal de assinatura.</summary>
public sealed record CheckoutResult(bool Ok, string? Url = null, string? Error = null, int StatusCode = 200);

/// <summary>Status de assinatura de uma clínica.</summary>
public sealed record TeamBillingDto(string TeamId, string Status, bool Active, DateTimeOffset? CurrentPeriodEnd);
