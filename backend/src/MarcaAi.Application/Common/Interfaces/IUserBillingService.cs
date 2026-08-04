using MarcaAi.Application.Features.Billing;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Assinatura SaaS **individual** (profissional autônomo) — estrutura separada da clínica (Q7).
/// Checkout/portal via Stripe Billing e leitura de status rico (plano/trial/uso/limites).
/// </summary>
public interface IUserBillingService
{
    /// <summary>Inicia checkout (nova) ou portal (existente) para um plano individual pago (ex.: SOLO_PRO).</summary>
    Task<CheckoutResult> CreateCheckoutAsync(string userId, string planCode, CancellationToken cancellationToken = default);

    /// <summary>Status de billing do profissional autenticado (plano efetivo, trial, uso, limites).</summary>
    Task<BillingStatusDto> GetStatusAsync(string userId, CancellationToken cancellationToken = default);
}
