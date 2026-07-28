using System.Security.Claims;
using MarcaAi.Api.Auth;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarcaAi.Api.Controllers;

/// <summary>
/// Login via Google (OAuth code flow). O handler "Google" (Program.cs) processa o CallbackPath
/// e assina no cookie temporário "ext"; aqui finalizamos: provisionamos o usuário, guardamos os
/// tokens do Calendar na Account e emitimos o cookie de sessão do MarcaAí.
/// Só é registrado se houver Google:ClientId/ClientSecret configurados.
/// </summary>
[ApiController]
[Route("api/v1/auth/google")]
public sealed class GoogleAuthController(
    IUserProvisioning provisioning,
    AuthSessionWriter session,
    IConfiguration config) : ControllerBase
{
    /// <summary>Inicia o fluxo — redireciona para o consentimento do Google.</summary>
    [AllowAnonymous]
    [HttpGet("start")]
    public IActionResult Start()
    {
        var props = new AuthenticationProperties { RedirectUri = Url.Action(nameof(Complete)) };
        return Challenge(props, "Google");
    }

    /// <summary>Finaliza o login: lê o resultado do Google, provisiona, emite a sessão e redireciona ao frontend.</summary>
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

        session.Issue(HttpContext, user);
        await HttpContext.SignOutAsync("ext"); // limpa o cookie temporário do handshake

        // Redireciona ao frontend: quem já concluiu o onboarding vai pro dashboard; o resto pro onboarding.
        var frontend = (config["Cors:FrontendOrigin"] ?? "http://localhost:3000").TrimEnd('/');
        var destination = user.Onboarded ? "/dashboard" : "/onboarding";
        return Redirect($"{frontend}{destination}");
    }
}
