namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Processa os webhooks do Stripe Connect (eventos da plataforma sobre contas conectadas e cobranças
/// com split): <c>account.updated</c> (KYC → PayoutAccount), <c>payment_intent.succeeded</c> e
/// <c>charge.refunded</c> (snapshot financeiro → Booking). Assinatura validada com o secret do Connect.
/// </summary>
public interface IStripeConnectWebhookHandler
{
    /// <summary>Valida a assinatura e processa o evento. Idempotente. Lança StripeException se a assinatura for inválida.</summary>
    Task HandleConnectWebhookAsync(string payload, string signature, CancellationToken cancellationToken = default);
}
