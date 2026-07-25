using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Payouts;
using MarcaAi.Domain.Entities;
using MarcaAi.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Payments;

/// <summary>
/// Implementação da gestão de sub-contas de recebimento usando a estratégia de ownership
/// polimórfico (OwnerType + OwnerId) — sem propriedade de navegação em User/Team.
/// Fase 2: cria/consulta as PayoutAccount e resolve o recebedor. A integração real de
/// OAuth (MP) / Account Link (Stripe) é ligada nas Fases 2/3 (marcadores TODO abaixo).
/// </summary>
public sealed class PayoutAccountService(
    IApplicationDbContext db, ILogger<PayoutAccountService> logger) : IPayoutAccountService
{
    public async Task<OnboardingResult> StartOnboardingAsync(
        PayoutOwnerType ownerType, string ownerId, PaymentProvider provider, CancellationToken ct = default)
    {
        // Idempotente por (OwnerType, OwnerId, Provider): reutiliza a conta pendente se já existir.
        var account = await db.PayoutAccounts.FirstOrDefaultAsync(
            a => a.OwnerType == ownerType && a.OwnerId == ownerId && a.Provider == provider, ct);

        if (account is null)
        {
            account = new PayoutAccount
            {
                OwnerType = ownerType,
                OwnerId = ownerId,
                Provider = provider,
                Status = PayoutAccountStatus.PENDING,
                // ExternalAccountId e OnboardingUrl preenchidos quando a integração real for ligada.
                ExternalAccountId = string.Empty,
            };
            db.PayoutAccounts.Add(account);
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "[Payouts] Onboarding iniciado: owner={OwnerType}/{OwnerId} provider={Provider} account={AccountId}",
                ownerType, ownerId, provider, account.Id);
        }

        // TODO (Fase 2 MP / Fase 3 Stripe): iniciar OAuth do Mercado Pago ou criar Express account +
        // Account Link do Stripe, persistir ExternalAccountId e OnboardingUrl, e mover para o secret store.
        return new OnboardingResult(account.Id, account.Provider, account.Status, account.OnboardingUrl);
    }

    public async Task<IReadOnlyList<PayoutAccountDto>> GetAccountsForOwnerAsync(
        PayoutOwnerType ownerType, string ownerId, CancellationToken ct = default)
    {
        var accounts = await db.PayoutAccounts
            .Where(a => a.OwnerType == ownerType && a.OwnerId == ownerId)
            .OrderBy(a => a.Provider)
            .ToListAsync(ct);
        return accounts.Select(ToDto).ToList();
    }

    public async Task<PayoutAccountDto?> GetAccountAsync(
        PayoutOwnerType ownerType, string ownerId, PaymentProvider provider, CancellationToken ct = default)
    {
        var account = await db.PayoutAccounts.FirstOrDefaultAsync(
            a => a.OwnerType == ownerType && a.OwnerId == ownerId && a.Provider == provider, ct);
        return account is null ? null : ToDto(account);
    }

    public async Task<PayoutAccountDto?> ResolveReceiverForEventTypeAsync(
        string eventTypeId, PaymentProvider provider, CancellationToken ct = default)
    {
        // EventType com TeamId → recebedor = clínica (TEAM); sem TeamId → profissional (USER). §4.1
        var et = await db.EventTypes
            .Where(x => x.Id == eventTypeId)
            .Select(x => new { x.UserId, x.TeamId })
            .FirstOrDefaultAsync(ct);
        if (et is null) return null;

        var (ownerType, ownerId) = et.TeamId is { Length: > 0 } teamId
            ? (PayoutOwnerType.TEAM, teamId)
            : (PayoutOwnerType.USER, et.UserId);

        return await GetAccountAsync(ownerType, ownerId, provider, ct);
    }

    public async Task<bool> DisconnectAsync(string payoutAccountId, CancellationToken ct = default)
    {
        var account = await db.PayoutAccounts.FirstOrDefaultAsync(a => a.Id == payoutAccountId, ct);
        if (account is null) return false;

        account.Status = PayoutAccountStatus.DISABLED;
        account.ChargesEnabled = false;
        account.PayoutsEnabled = false;
        await db.SaveChangesAsync(ct);
        // TODO (Fases 2/3): revogar tokens OAuth do MP / desconectar a conta Stripe Connect.
        return true;
    }

    private static PayoutAccountDto ToDto(PayoutAccount a) => new(
        a.Id, a.OwnerType, a.OwnerId, a.Provider,
        string.IsNullOrEmpty(a.ExternalAccountId) ? null : a.ExternalAccountId,
        a.Status, a.ChargesEnabled, a.PayoutsEnabled, a.OnboardingUrl,
        a.FeePercentBps, a.FeeFixedCents, a.AbsorbGatewayCost, a.CreatedAt, a.UpdatedAt);
}
