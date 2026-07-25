using MarcaAi.Application.Features.Payments;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Cobrança PIX de consultas (Mercado Pago). Retorna null se não configurado.</summary>
public interface IPixPaymentService
{
    Task<PixCharge?> CreateAsync(
        decimal amountReais, string description, string payerEmail, string payerFirstName,
        string externalReference, CancellationToken cancellationToken = default);

    /// <summary>Consulta um pagamento pelo id (para o webhook). Null se não configurado/erro.</summary>
    Task<PaymentStatusInfo?> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default);
}
