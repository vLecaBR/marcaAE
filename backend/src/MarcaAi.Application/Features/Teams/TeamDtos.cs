using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.Teams;

/// <summary>Criação/edição de clínica (equipe).</summary>
public sealed record TeamInput(
    string Name,
    string Slug,
    string? Description,
    string? Logo,
    string? Theme,        // DARK | LIGHT | SYSTEM
    string? BrandColor);

/// <summary>Resumo de uma clínica na visão do usuário (com o papel dele).</summary>
public sealed record TeamDto(
    string Id, string Name, string Slug, string? Description, string? Logo,
    Theme Theme, string? BrandColor, TeamRole Role, int MemberCount);

/// <summary>Membro da clínica.</summary>
public sealed record TeamMemberDto(string UserId, string? Name, string Email, TeamRole Role);

/// <summary>Detalhe da clínica com membros.</summary>
public sealed record TeamDetailDto(
    string Id, string Name, string Slug, string? Description, string? Logo,
    Theme Theme, string? BrandColor, TeamRole Role, IReadOnlyList<TeamMemberDto> Members);

/// <summary>Convite de membro (por e-mail de usuário já existente).</summary>
public sealed record InviteMemberInput(string Email, string? Role);  // ADMIN | MEMBER (padrão MEMBER)
