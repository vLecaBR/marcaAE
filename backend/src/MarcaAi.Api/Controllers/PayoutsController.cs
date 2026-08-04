using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Payouts;
using MarcaAi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

/// <summary>
/// Onboarding e status das sub-contas de recebimento (split de marketplace). Resolve o owner
/// (USER/TEAM) via estratégia polimórfica; contas de TEAM exigem que o chamador seja gestor
/// (OWNER/ADMIN) da clínica. Ver financial-split-spec.md §6.1 e §7.3.
/// </summary>
[ApiController]
[Route("api/v1/payouts")]
[Authorize]
public sealed class PayoutsController(IPayoutAccountService payouts, IApplicationDbContext db) : ControllerBase
{
    /// <summary>Chamador é gestor (OWNER/ADMIN) da clínica? Gate das contas de recebimento de TEAM.</summary>
    private async Task<bool> IsTeamManagerAsync(string teamId, string userId, CancellationToken ct)
    {
        var role = await db.TeamMembers.AsNoTracking()
            .Where(m => m.TeamId == teamId && m.UserId == userId)
            .Select(m => (TeamRole?)m.Role)
            .FirstOrDefaultAsync(ct);
        return role is TeamRole.OWNER or TeamRole.ADMIN;
    }

    /// <summary>
    /// Inicia (ou retoma) o onboarding de uma sub-conta. Sem TeamId → conta do profissional (USER);
    /// com TeamId → conta da clínica (TEAM). Retorna o estado e, quando disponível, a URL de KYC.
    /// </summary>
    [HttpPost("onboarding")]
    public async Task<ActionResult<OnboardingResult>> StartOnboarding(
        [FromBody] StartOnboardingRequest body, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var (ownerType, ownerId) = ResolveOwner(userId, body.TeamId);

        // Contas de clínica (TEAM) só podem ser conectadas por gestor da clínica (OWNER/ADMIN).
        if (ownerType == PayoutOwnerType.TEAM && !await IsTeamManagerAsync(ownerId, userId, ct))
            return Problem(statusCode: StatusCodes.Status403Forbidden,
                detail: "Apenas gestores da clínica podem configurar os recebimentos dela.");

        var result = await payouts.StartOnboardingAsync(ownerType, ownerId, body.Provider, ct);
        return Ok(result);
    }

    /// <summary>Lista as sub-contas do profissional autenticado (USER).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PayoutAccountDto>>> ListMine(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var accounts = await payouts.GetAccountsForOwnerAsync(PayoutOwnerType.USER, userId, ct);
        return Ok(accounts);
    }

    /// <summary>Status da sub-conta do profissional autenticado para um provedor específico.</summary>
    [HttpGet("{provider}/status")]
    public async Task<ActionResult<PayoutAccountDto>> Status(PaymentProvider provider, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var account = await payouts.GetAccountAsync(PayoutOwnerType.USER, userId, provider, ct);
        return account is null ? NotFound() : Ok(account);
    }

    /// <summary>Lista as sub-contas de uma clínica (TEAM).</summary>
    [HttpGet("teams/{teamId}")]
    public async Task<ActionResult<IReadOnlyList<PayoutAccountDto>>> ListForTeam(string teamId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        if (!await IsTeamManagerAsync(teamId, userId, ct))
            return Problem(statusCode: StatusCodes.Status403Forbidden,
                detail: "Apenas gestores da clínica podem ver os recebimentos dela.");

        var accounts = await payouts.GetAccountsForOwnerAsync(PayoutOwnerType.TEAM, teamId, ct);
        return Ok(accounts);
    }

    /// <summary>Desconecta (desabilita) uma sub-conta.</summary>
    [HttpDelete("{payoutAccountId}")]
    public async Task<IActionResult> Disconnect(string payoutAccountId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        // TODO (RBAC): garantir que a sub-conta pertence ao usuário ou a uma clínica que ele gere.

        var ok = await payouts.DisconnectAsync(payoutAccountId, ct);
        return ok ? NoContent() : NotFound();
    }

    private static (PayoutOwnerType ownerType, string ownerId) ResolveOwner(string userId, string? teamId) =>
        teamId is { Length: > 0 }
            ? (PayoutOwnerType.TEAM, teamId)
            : (PayoutOwnerType.USER, userId);
}
