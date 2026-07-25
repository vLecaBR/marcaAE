using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Payments;
using MarcaAi.Domain.Enums;
using MarcaAi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Payments;

/// <summary>
/// Orquestra a iniciação de pagamento de uma consulta e roteia para o provedor conforme o método:
/// hoje cartão → Stripe Connect (a rota PIX/MP entra quando o split do MP for ligado). Calcula a taxa
/// (FeeCalculator + overrides da sub-conta) e grava o snapshot financeiro no Booking. Ver spec §6.2.
/// </summary>
public sealed class BookingPaymentService(
    ApplicationDbContext db,
    IPayoutAccountService payouts,
    IEnumerable<ISplitPaymentService> splitProviders,
    IConfiguration config,
    ILogger<BookingPaymentService> logger) : IBookingPaymentService
{
    // Defaults da plataforma (§8): PLATFORM_FEE_BPS=250 (2,5%), PLATFORM_FEE_FIXED_CENTS=100 (R$1,00).
    // Usa o indexer de IConfiguration (Abstractions) para não depender do ConfigurationBinder.
    private int DefaultFeeBps => ParseIntOr(config["Platform:FeeBps"], 250);
    private int DefaultFeeFixedCents => ParseIntOr(config["Platform:FeeFixedCents"], 100);

    private static int ParseIntOr(string? value, int fallback) =>
        int.TryParse(value, out var parsed) ? parsed : fallback;

    public async Task<PaymentInitResult> InitiateAsync(
        string bookingUid, PaymentProvider provider, CancellationToken ct = default)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Uid == bookingUid, ct);
        if (booking is null)
            return new PaymentInitResult(PaymentInitOutcome.BookingNotFound, Message: "Agendamento não encontrado.");
        if (booking.PaymentStatus == PaymentStatus.PAID)
            return new PaymentInitResult(PaymentInitOutcome.AlreadyPaid, Message: "Consulta já paga.");

        var eventType = await db.EventTypes.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == booking.EventTypeId, ct);
        if (eventType?.Price is not > 0)
            return new PaymentInitResult(PaymentInitOutcome.NotPayable, Message: "Consulta sem preço definido.");

        var gross = eventType.Price.Value;

        // Recebedor do split (USER ou TEAM, §4.1) para o provedor escolhido.
        var receiver = await payouts.ResolveReceiverForEventTypeAsync(booking.EventTypeId, provider, ct);
        if (receiver is null || receiver.Status != PayoutAccountStatus.ACTIVE ||
            !receiver.ChargesEnabled || string.IsNullOrEmpty(receiver.ExternalAccountId))
        {
            return new PaymentInitResult(PaymentInitOutcome.NoActiveAccount,
                Message: "O profissional/clínica ainda não concluiu o cadastro de recebimentos.");
        }

        // Taxa: override da sub-conta tem precedência sobre o padrão da plataforma.
        var fee = FeeCalculator.Compute(new FeeInput(
            GrossCents: gross,
            FeePercentBps: receiver.FeePercentBps ?? DefaultFeeBps,
            FeeFixedCents: receiver.FeeFixedCents ?? DefaultFeeFixedCents,
            GatewayCostCents: 0,
            AbsorbGatewayCost: receiver.AbsorbGatewayCost));

        var splitService = splitProviders.FirstOrDefault(s => s.Provider == provider);
        if (splitService is null)
            return new PaymentInitResult(PaymentInitOutcome.ProviderError, Message: $"Provedor {provider} indisponível.");

        var charge = await splitService.CreateChargeAsync(new SplitChargeRequest(
            GrossCents: gross,
            ApplicationFeeCents: fee.PlatformFeeCents,
            DestinationAccountId: receiver.ExternalAccountId!,
            Currency: eventType.Currency,
            BookingUid: booking.Uid,
            Description: $"Consulta: {eventType.Title}",
            GuestEmail: booking.GuestEmail), ct);

        if (charge is null)
            return new PaymentInitResult(PaymentInitOutcome.ProviderError, Message: "Falha ao iniciar o pagamento.");

        // Snapshot financeiro (confirmado como PAID apenas no webhook). §5.4/§6.2.
        booking.PriceCents ??= gross;
        booking.Currency = eventType.Currency;
        booking.PaymentProvider = provider;
        booking.PayoutAccountId = receiver.Id;
        booking.PlatformFeeCents = fee.PlatformFeeCents;
        booking.NetToProviderCents = fee.NetToProviderCents;
        booking.ProviderPaymentId = charge.ProviderPaymentId;
        booking.PaymentStatus = PaymentStatus.PENDING;
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[Payments] Cobrança iniciada booking={Uid} provider={Provider} gross={Gross} fee={Fee}",
            booking.Uid, provider, gross, fee.PlatformFeeCents);

        return new PaymentInitResult(
            PaymentInitOutcome.Success, provider, charge.ProviderPaymentId, charge.ClientSecret,
            gross, fee.PlatformFeeCents,
            PixQrCode: charge.PixQrCode,
            PixQrCodeBase64: charge.PixQrCodeBase64,
            PixTicketUrl: charge.PixTicketUrl);
    }
}
