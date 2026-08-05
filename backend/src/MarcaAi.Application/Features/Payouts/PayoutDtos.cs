using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.Payouts;

/// <summary>Corpo do pedido para iniciar o onboarding de uma sub-conta.</summary>
/// <param name="Provider">Provedor desejado (MERCADO_PAGO p/ PIX, STRIPE p/ cartão).</param>
/// <param name="TeamId">
/// Se informado, a sub-conta é da clínica (owner = TEAM) e requer permissão de gestor da clínica;
/// se null, a sub-conta é do profissional autenticado (owner = USER). Ver §4.1.
/// </param>
public sealed record StartOnboardingRequest(PaymentProvider Provider, string? TeamId = null);

/// <summary>Classificação do início de onboarding, para roteamento HTTP (200 / 502 / 503).</summary>
public enum OnboardingOutcome
{
    /// <summary>Fluxo ok — há URL de KYC (ou conta já ACTIVE / provedor sem integração real).</summary>
    Success,
    /// <summary>Provedor não configurado no ambiente (SecretKey / App:PublicUrl). → 503.</summary>
    NotConfigured,
    /// <summary>O provedor recusou/ falhou ao abrir o cadastro. → 502.</summary>
    ProviderError,
}

/// <summary>Resultado do início de onboarding de uma sub-conta de recebimento.</summary>
/// <param name="PayoutAccountId">Id da <c>PayoutAccount</c> criada/existente (PENDING até o KYC concluir).</param>
/// <param name="Provider">Provedor da sub-conta (MP ou Stripe).</param>
/// <param name="Status">Estado atual do onboarding/KYC.</param>
/// <param name="OnboardingUrl">
/// URL para o dono concluir o KYC no provedor (OAuth do MP / Account Link do Stripe).
/// Null quando o provedor ainda não tem integração real (esqueleto) ou em caso de falha.
/// </param>
/// <param name="Outcome">Classificação do resultado (para o controller mapear o status HTTP).</param>
/// <param name="ErrorCode">Código estável da causa quando <paramref name="Outcome"/> ≠ Success.</param>
/// <param name="ErrorMessage">Mensagem acionável quando <paramref name="Outcome"/> ≠ Success.</param>
public sealed record OnboardingResult(
    string PayoutAccountId,
    PaymentProvider Provider,
    PayoutAccountStatus Status,
    string? OnboardingUrl,
    OnboardingOutcome Outcome = OnboardingOutcome.Success,
    string? ErrorCode = null,
    string? ErrorMessage = null);

/// <summary>Projeção de leitura de uma sub-conta de recebimento (sem segredos).</summary>
public sealed record PayoutAccountDto(
    string Id,
    PayoutOwnerType OwnerType,
    string OwnerId,
    PaymentProvider Provider,
    string? ExternalAccountId,
    PayoutAccountStatus Status,
    bool ChargesEnabled,
    bool PayoutsEnabled,
    string? OnboardingUrl,
    int? FeePercentBps,
    int? FeeFixedCents,
    bool AbsorbGatewayCost,
    DateTime CreatedAt,
    DateTime UpdatedAt);
