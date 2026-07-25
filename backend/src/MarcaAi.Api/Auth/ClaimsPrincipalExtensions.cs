using System.Security.Claims;

namespace MarcaAi.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Id do usuário autenticado (claim "sub" do JWT). Null se não autenticado.</summary>
    public static string? GetUserId(this ClaimsPrincipal user) => user.FindFirst("sub")?.Value;
}
