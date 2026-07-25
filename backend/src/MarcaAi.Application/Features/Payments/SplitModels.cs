namespace MarcaAi.Application.Features.Payments;

/// <summary>
/// Pedido de cobrança com split (provider-agnóstico). Todos os valores monetários em centavos.
/// O recebedor é a sub-conta conectada; a taxa da plataforma é retida na origem.
/// </summary>
/// <param name="GrossCents">Valor total pago pelo paciente (preço cheio da consulta).</param>
/// <param name="ApplicationFeeCents">Taxa MarcaAí retida (application fee), em centavos.</param>
/// <param name="DestinationAccountId">Id da conta conectada que recebe o líquido (Stripe acct_... / MP user_id).</param>
/// <param name="Currency">Moeda ISO (ex.: "BRL").</param>
/// <param name="BookingUid">Uid público do booking — usado como referência externa e chave de idempotência.</param>
/// <param name="Description">Descrição exibida na cobrança.</param>
/// <param name="GuestEmail">E-mail do paciente (recibo).</param>
public sealed record SplitChargeRequest(
    int GrossCents,
    int ApplicationFeeCents,
    string DestinationAccountId,
    string Currency,
    string BookingUid,
    string Description,
    string GuestEmail);

/// <summary>Resultado da criação de uma cobrança com split.</summary>
/// <param name="ProviderPaymentId">Id canônico do pagamento no provedor (ex.: PaymentIntent pi_... / payment id do MP).</param>
/// <param name="ClientSecret">Segredo para o frontend confirmar o pagamento (Stripe.js). Null quando não aplicável (ex.: PIX).</param>
/// <param name="Status">Status do pagamento no provedor no momento da criação.</param>
/// <param name="PixQrCode">PIX copia-e-cola (payload EMV). Preenchido quando o método é PIX (Mercado Pago).</param>
/// <param name="PixQrCodeBase64">Imagem do QR Code em base64 (PNG). Preenchido quando o método é PIX.</param>
/// <param name="PixTicketUrl">URL do comprovante/checkout do PIX. Preenchido quando o método é PIX.</param>
public sealed record SplitChargeResult(
    string ProviderPaymentId,
    string? ClientSecret,
    string Status,
    string? PixQrCode = null,
    string? PixQrCodeBase64 = null,
    string? PixTicketUrl = null);

/// <summary>Resultado de um reembolso.</summary>
/// <param name="RefundId">Id do reembolso no provedor.</param>
/// <param name="Status">Status do reembolso.</param>
/// <param name="AmountCents">Valor reembolsado, em centavos.</param>
public sealed record RefundResult(
    string RefundId,
    string Status,
    int AmountCents);
