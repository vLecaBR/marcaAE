using System.Security.Claims;
using System.Security.Cryptography;
using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Auth;
using MarcaAi.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Api.Controllers;

/// <summary>
/// Login via Google (OAuth code flow). O handler "Google" (Program.cs) processa o CallbackPath
/// e assina no cookie temporário "ext"; aqui finalizamos: provisionamos o usuário e guardamos os
/// tokens do Calendar na Account.
///
/// Cookie cross-domain: a API e o frontend vivem em domínios diferentes, então a sessão NÃO pode
/// ser emitida aqui (o cookie ficaria preso no domínio da API). Em vez disso o /complete gera um
/// código de troca de uso único e redireciona para {FRONT}/auth/callback?code=..., e o frontend
/// troca o código pela sessão no /exchange e re-emite o cookie no domínio dele — mesmo princípio
/// do magic link, que já funciona.
///
/// Só é registrado se houver Google:ClientId/ClientSecret configurados.
/// </summary>
[ApiController]
[Route("api/v1/auth/google")]
public sealed class GoogleAuthController(
    IApplicationDbContext db,
    IUserProvisioning provisioning,
    AuthSessionWriter session,
    IConfiguration config) : ControllerBase
{
    /// <summary>Janela curta para trocar o código pela sessão (uso único).</summary>
    private static readonly TimeSpan HandoffTtl = TimeSpan.FromMinutes(2);

    /// <summary>Prefixo no Identifier do token para distinguir o handoff do Google de um magic link.</summary>
    private const string HandoffIdentifierPrefix = "google-handoff:";

    /// <summary>Inicia o fluxo — redireciona para o consentimento do Google.</summary>
    [AllowAnonymous]
    [HttpGet("start")]
    public IActionResult Start()
    {
        var props = new AuthenticationProperties { RedirectUri = Url.Action(nameof(Complete)) };
        return Challenge(props, "Google");
    }

    /// <summary>
    /// Finaliza o handshake do Google: provisiona o usuário, gera um código de troca de uso único
    /// e redireciona ao frontend. NÃO emite a sessão aqui (ver nota da classe sobre cross-domain).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("complete")]
    public async Task<IActionResult> Complete(CancellationToken ct)
    {
        var result = await HttpContext.AuthenticateAsync("ext");
        if (!result.Succeeded || result.Principal is null || result.Properties is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Falha na autenticação com o Google.");

        var email = result.Principal.FindFirstValue(ClaimTypes.Email);
        var name = result.Principal.FindFirstValue(ClaimTypes.Name);
        var googleSub = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(googleSub))
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Perfil do Google incompleto.");

        long? expiresUnix = DateTimeOffset.TryParse(result.Properties.GetTokenValue("expires_at"), out var eo)
            ? eo.ToUnixTimeSeconds()
            : null;

        var user = await provisioning.FindOrCreateWithGoogleAsync(new GoogleProfile(
            Email: email,
            Name: name,
            GoogleUserId: googleSub,
            AccessToken: result.Properties.GetTokenValue("access_token"),
            RefreshToken: result.Properties.GetTokenValue("refresh_token"),
            ExpiresAtUnix: expiresUnix,
            Scope: result.Properties.GetTokenValue("scope")), ct);

        await HttpContext.SignOutAsync("ext"); // limpa o cookie temporário do handshake

        // Código de troca de uso único (reaproveita a tabela VerificationToken, como o magic link).
        var code = Base64UrlToken(32);
        db.VerificationTokens.Add(new VerificationToken
        {
            Identifier = HandoffIdentifierPrefix + user.Email,
            Token = code,
            Expires = DateTime.UtcNow.Add(HandoffTtl),
        });
        await db.SaveChangesAsync(ct);

        // Contrato: docs/backend-backlog.md → "Contrato de redirect do front".
        var frontend = (config["Cors:FrontendOrigin"] ?? "http://localhost:3000").TrimEnd('/');
        return Redirect($"{frontend}/auth/callback?code={Uri.EscapeDataString(code)}");
    }

    /// <summary>
    /// Troca o código de handoff pela sessão (uso único). Chamado server-side pelo /auth/callback do
    /// frontend, que re-emite os cookies de sessão no próprio domínio.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("exchange")]
    public async Task<ActionResult<MeDto>> Exchange([FromQuery] string code, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Código ausente.");

        var vt = await db.VerificationTokens.FirstOrDefaultAsync(v => v.Token == code, ct);
        if (vt is null
            || !vt.Identifier.StartsWith(HandoffIdentifierPrefix, StringComparison.Ordinal)
            || vt.Expires < DateTime.UtcNow)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Código inválido ou expirado.");

        db.VerificationTokens.Remove(vt); // uso único
        await db.SaveChangesAsync(ct);

        var email = vt.Identifier[HandoffIdentifierPrefix.Length..];
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Usuário não encontrado.");

        session.Issue(HttpContext, user); // agora sim: cookies vão na resposta que o front re-emite
        return Ok(new MeDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            Onboarded = user.Onboarded,
            TimeZone = user.TimeZone,
        });
    }

    private static string Base64UrlToken(int bytes)
    {
        var buf = RandomNumberGenerator.GetBytes(bytes);
        return Convert.ToBase64String(buf).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
