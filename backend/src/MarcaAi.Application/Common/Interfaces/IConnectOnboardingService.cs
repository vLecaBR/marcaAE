using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Onboarding/KYC da sub-conta conectada de um provedor (Stripe Connect Express / Mercado Pago).
/// Provider-agnóstica: cada gateway registra uma implementação, resolvida por <see cref="Provider"/>.
/// Separada de <see cref="ISplitPaymentService"/> (cobrança) porque o ciclo de vida da conta é
/// independente do fluxo de pagamento. Ver financial-split-spec.md §6.1 e §7.1.
/// </summary>
public interface IConnectOnboardingService
{
    /// <summary>Provedor atendido por esta implementação (discriminador da resolução por coleção).</summary>
    PaymentProvider Provider { get; }

    /// <summary>
    /// Cria (ou retoma) a conta conectada do owner no provedor e devolve o link de KYC para o dono
    /// concluir o cadastro. Idempotente: se <paramref name="existingExternalAccountId"/> já existir,
    /// reaproveita a conta e apenas gera um novo Account Link. Retorna <c>null</c> se o provedor não
    /// estiver configurado (ex.: chave ausente) — o chamador mantém a conta em PENDING sem URL.
    /// </summary>
    /// <param name="existingExternalAccountId">Id da conta no provedor, se já criada. Null/vazio = criar.</param>
    /// <param name="ownerReference">Referência do owner (ex.: "USER:abc") gravada como metadado para rastreio.</param>
    Task<ConnectOnboardingResult?> CreateOnboardingLinkAsync(
        string? existingExternalAccountId,
        string ownerReference,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Resultado do onboarding: id da conta no provedor + URL de KYC para redirecionar o dono.
/// </summary>
/// <param name="ExternalAccountId">Id da conta conectada no provedor (ex.: Stripe acct_...).</param>
/// <param name="OnboardingUrl">Account Link (Stripe) / URL de OAuth (MP) para concluir o cadastro.</param>
public sealed record ConnectOnboardingResult(string ExternalAccountId, string OnboardingUrl);
