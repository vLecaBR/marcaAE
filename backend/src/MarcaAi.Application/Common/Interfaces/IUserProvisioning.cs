using MarcaAi.Domain.Entities;

namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Localiza ou cria o usuário por e-mail, semeando a agenda padrão (como o evento createUser fazia).</summary>
public interface IUserProvisioning
{
    Task<User> FindOrCreateByEmailAsync(string email, CancellationToken cancellationToken = default);
}
