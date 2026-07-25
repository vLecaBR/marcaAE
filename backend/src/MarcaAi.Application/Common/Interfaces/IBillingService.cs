using MarcaAi.Application.Features.Billing;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Assinatura B2B das clínicas via Stripe.</summary>
public interface IBillingService
{
    /// <summary>Inicia checkout (nova assinatura) ou portal (se já é cliente). Só OWNER da equipe.</summary>
    Task<CheckoutResult> CreateCheckoutAsync(string teamId, string userId, CancellationToken cancellationToken = default);

    /// <summary>Status da assinatura (precisa ser membro). Null se equipe inexistente/sem acesso.</summary>
    Task<TeamBillingDto?> GetStatusAsync(string teamId, string userId, CancellationToken cancellationToken = default);

    /// <summary>Processa um evento de webhook do Stripe (valida assinatura + atualiza a Subscription).</summary>
    Task HandleWebhookAsync(string payload, string signature, CancellationToken cancellationToken = default);
}
