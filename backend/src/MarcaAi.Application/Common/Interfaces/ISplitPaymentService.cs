using MarcaAi.Application.Features.Payments;
using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Abstração provider-agnóstica de cobrança com split de marketplace (Mercado Pago Split / Stripe Connect).
/// Cada implementação declara seu <see cref="Provider"/>; o roteamento por método de pagamento escolhe a
/// implementação correta. Ver financial-split-spec.md §7.1.
/// </summary>
public interface ISplitPaymentService
{
    /// <summary>Provedor atendido por esta implementação (discriminador para roteamento).</summary>
    PaymentProvider Provider { get; }

    /// <summary>
    /// Cria uma cobrança que retém a taxa da plataforma e repassa o líquido à conta conectada.
    /// Idempotente por <see cref="SplitChargeRequest.BookingUid"/>. Retorna null se o provedor não estiver configurado.
    /// </summary>
    Task<SplitChargeResult?> CreateChargeAsync(SplitChargeRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reembolsa (total ou parcial) um pagamento pelo id canônico do provedor. A taxa é devolvida
    /// proporcionalmente pela política do gateway/plataforma. Null se não configurado.
    /// </summary>
    Task<RefundResult?> RefundAsync(string providerPaymentId, int? amountCents = null, CancellationToken cancellationToken = default);
}
