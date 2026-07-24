using MarcaAi.Application.Features.Auth;
using MarcaAi.Domain.Entities;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Localiza ou cria o usuário, semeando a agenda padrão (como o evento createUser fazia).</summary>
public interface IUserProvisioning
{
    /// <summary>Fluxo Magic Link: localiza/cria por e-mail.</summary>
    Task<User> FindOrCreateByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Fluxo Google: localiza/cria por e-mail e faz upsert da conta OAuth (tokens do Calendar).</summary>
    Task<User> FindOrCreateWithGoogleAsync(GoogleProfile profile, CancellationToken cancellationToken = default);
}
