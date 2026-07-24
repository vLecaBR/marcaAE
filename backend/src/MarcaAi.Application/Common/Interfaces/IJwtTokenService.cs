using System.Security.Claims;
using MarcaAi.Application.Features.Auth;
using MarcaAi.Domain.Entities;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Emissão e validação dos tokens (access + refresh) do MarcaAí.</summary>
public interface IJwtTokenService
{
    /// <summary>Emite um par access+refresh para o usuário (claims: sub, email, username, onboarded, timeZone).</summary>
    AuthTokens Issue(User user);

    /// <summary>Valida um refresh token e retorna o principal, ou null se inválido/expirado/errado.</summary>
    ClaimsPrincipal? ValidateRefreshToken(string refreshToken);
}
