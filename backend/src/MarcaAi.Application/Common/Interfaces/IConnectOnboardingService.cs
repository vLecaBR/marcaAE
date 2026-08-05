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
    /// reaproveita a conta e apenas gera um novo Account Link.
    /// </summary>
    /// <remarks>
    /// Nunca retorna null nem mascara a causa (bug 3): o resultado é um <see cref="ConnectOnboardingResult"/>
    /// discriminado por <see cref="OnboardingLinkOutcome"/>, permitindo ao chamador diferenciar
    /// <c>NotConfigured</c> (config ausente/ inválida → 503) de <c>ProviderError</c> (falha do gateway → 502).
    /// </remarks>
    /// <param name="existingExternalAccountId">Id da conta no provedor, se já criada. Null/vazio = criar.</param>
    /// <param name="ownerReference">Referência do owner (ex.: "USER:abc") gravada como metadado para rastreio.</param>
    Task<ConnectOnboardingResult> CreateOnboardingLinkAsync(
        string? existingExternalAccountId,
        string ownerReference,
        CancellationToken cancellationToken = default);
}

/// <summary>Classificação do resultado do onboarding, para roteamento de erro (config vs provedor).</summary>
public enum OnboardingLinkOutcome
{
    /// <summary>Link de KYC gerado com sucesso.</summary>
    Success,
    /// <summary>Provedor não configurado/ config inválida (ex.: SecretKey ausente, App:PublicUrl inválida). → 503.</summary>
    NotConfigured,
    /// <summary>O provedor recusou/ falhou (StripeException). → 502, com a causa real.</summary>
    ProviderError,
}

/// <summary>
/// Resultado do onboarding: outcome + (em sucesso) id da conta no provedor e URL de KYC; em falha,
/// código e mensagem acionáveis. Substitui o antigo retorno nullable que mascarava a causa (bug 3).
/// </summary>
/// <param name="Outcome">Classificação do resultado.</param>
/// <param name="ExternalAccountId">Id da conta conectada no provedor (ex.: Stripe acct_...). Só em sucesso.</param>
/// <param name="OnboardingUrl">Account Link (Stripe) / URL de OAuth (MP) para concluir o cadastro. Só em sucesso.</param>
/// <param name="ErrorCode">Código estável da causa (ex.: StripeError.Code, "provider_not_configured"). Só em falha.</param>
/// <param name="Message">Mensagem acionável para logs/UX. Só em falha.</param>
public sealed record ConnectOnboardingResult(
    OnboardingLinkOutcome Outcome,
    string? ExternalAccountId = null,
    string? OnboardingUrl = null,
    string? ErrorCode = null,
    string? Message = null)
{
    public static ConnectOnboardingResult Ok(string externalAccountId, string onboardingUrl) =>
        new(OnboardingLinkOutcome.Success, externalAccountId, onboardingUrl);

    public static ConnectOnboardingResult NotConfigured(string message, string errorCode = "provider_not_configured") =>
        new(OnboardingLinkOutcome.NotConfigured, ErrorCode: errorCode, Message: message);

    public static ConnectOnboardingResult ProviderError(string? errorCode, string message) =>
        new(OnboardingLinkOutcome.ProviderError, ErrorCode: errorCode, Message: message);
}
