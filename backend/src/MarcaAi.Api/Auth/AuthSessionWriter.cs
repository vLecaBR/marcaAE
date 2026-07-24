using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace MarcaAi.Api.Auth;

/// <summary>
/// Emite/limpa os cookies de sessão (access + refresh JWT) em cookies HttpOnly + SameSite=Strict.
/// Compartilhado entre o login por Magic Link e o login pelo Google.
/// </summary>
public sealed class AuthSessionWriter(IJwtTokenService tokens, IConfiguration config)
{
    private string AccessCookie => config["Jwt:CookieName"] ?? "marcaai_at";
    private string RefreshCookie => config["Jwt:RefreshCookieName"] ?? "marcaai_rt";

    public void Issue(HttpContext ctx, User user)
    {
        var t = tokens.Issue(user);
        ctx.Response.Cookies.Append(AccessCookie, t.AccessToken, Options(ctx, "/", t.AccessExpiresAt));
        ctx.Response.Cookies.Append(RefreshCookie, t.RefreshToken, Options(ctx, "/api/v1/auth", t.RefreshExpiresAt));
    }

    public void Clear(HttpContext ctx)
    {
        ctx.Response.Cookies.Delete(AccessCookie, Options(ctx, "/", null));
        ctx.Response.Cookies.Delete(RefreshCookie, Options(ctx, "/api/v1/auth", null));
    }

    private static CookieOptions Options(HttpContext ctx, string path, DateTimeOffset? expires) => new()
    {
        HttpOnly = true,
        Secure = ctx.Request.IsHttps,   // prod (https) => sempre Secure; dev http => false p/ testar
        SameSite = SameSiteMode.Strict,
        Path = path,
        Expires = expires,
    };
}
