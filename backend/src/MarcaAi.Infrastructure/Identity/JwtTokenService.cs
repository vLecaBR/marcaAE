using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Auth;
using MarcaAi.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MarcaAi.Infrastructure.Identity;

/// <summary>Emite/valida JWTs (access + refresh) assinados com HMAC-SHA256.</summary>
public sealed class JwtTokenService(IConfiguration config) : IJwtTokenService
{
    // Claims customizadas (as policies em Program.cs dependem de "onboarded").
    public const string ClaimUsername = "username";
    public const string ClaimOnboarded = "onboarded";
    public const string ClaimTimeZone = "timeZone";
    public const string ClaimTokenUse = "token_use";

    private string Issuer => config["Jwt:Issuer"]!;
    private string Audience => config["Jwt:Audience"]!;
    private SymmetricSecurityKey Key =>
        new(Encoding.UTF8.GetBytes(config["Jwt:SigningKey"]
            ?? throw new InvalidOperationException("Jwt:SigningKey ausente.")));

    public AuthTokens Issue(User user)
    {
        var now = DateTimeOffset.UtcNow;
        var accessMinutes = int.TryParse(config["Jwt:AccessTokenMinutes"], out var m) ? m : 15;
        var refreshDays = int.TryParse(config["Jwt:RefreshTokenDays"], out var d) ? d : 30;

        var accessExp = now.AddMinutes(accessMinutes);
        var refreshExp = now.AddDays(refreshDays);

        var baseClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimUsername, user.Username ?? string.Empty),
            new(ClaimOnboarded, user.Onboarded ? "true" : "false"),
            new(ClaimTimeZone, user.TimeZone),
        };

        var accessClaims = new List<Claim>(baseClaims)
            { new(ClaimTokenUse, "access"), new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) };
        var refreshClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTokenUse, "refresh"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        return new AuthTokens(
            Write(accessClaims, accessExp), accessExp,
            Write(refreshClaims, refreshExp), refreshExp);
    }

    public ClaimsPrincipal? ValidateRefreshToken(string refreshToken)
    {
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        try
        {
            var principal = handler.ValidateToken(refreshToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = Issuer,
                ValidAudience = Audience,
                IssuerSigningKey = Key,
                ClockSkew = TimeSpan.FromSeconds(30),
            }, out _);

            // Só aceita tokens marcados como refresh.
            return principal.FindFirst(ClaimTokenUse)?.Value == "refresh" ? principal : null;
        }
        catch
        {
            return null;
        }
    }

    private string Write(IEnumerable<Claim> claims, DateTimeOffset expires)
    {
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires.UtcDateTime,
            signingCredentials: new SigningCredentials(Key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
