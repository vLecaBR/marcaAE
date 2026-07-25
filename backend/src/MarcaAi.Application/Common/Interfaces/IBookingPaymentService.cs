using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Desfecho da iniciação de um pagamento de consulta.</summary>
public enum PaymentInitOutcome
{
    Success,
    BookingNotFound,
    NotPayable,        // consulta sem preço
    AlreadyPaid,
    NoActiveAccount,   // recebedor sem sub-conta ACTIVE p/ o provedor
    ProviderError,
}

/// <summary>
/// Resultado da iniciação de pagamento. Cartão (Stripe) → <see cref="ClientSecret"/>;
/// PIX (Mercado Pago) → <see cref="PixQrCode"/> (copia-e-cola) + <see cref="PixQrCodeBase64"/>.
/// </summary>
public sealed record PaymentInitResult(
    PaymentInitOutcome Outcome,
    PaymentProvider? Provider = null,
    string? ProviderPaymentId = null,
    string? ClientSecret = null,
    int? AmountCents = null,
    int? ApplicationFeeCents = null,
    string? PixQrCode = null,
    string? PixQrCodeBase64 = null,
    string? PixTicketUrl = null,
    string? Message = null);

/// <summary>
/// Orquestra a iniciação de pagamento de uma consulta: resolve o recebedor do split, calcula a taxa,
/// roteia para o provedor correto conforme o método (cartão → Stripe Connect) e grava o snapshot
/// financeiro imutável no Booking. Ver financial-split-spec.md §6.2.
/// </summary>
public interface IBookingPaymentService
{
    Task<PaymentInitResult> InitiateAsync(
        string bookingUid, PaymentProvider provider, CancellationToken cancellationToken = default);
}
