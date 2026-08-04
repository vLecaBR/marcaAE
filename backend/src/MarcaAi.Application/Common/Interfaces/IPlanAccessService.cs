namespace MarcaAi.Application.Common.Interfaces;

/// <summary>
/// Resolve o plano **efetivo** (assinatura ativa, senão Solo free) de um usuário ou clínica e
/// responde se a feature premium está liberada. Fonte de verdade do enforcement no backend (Q7).
/// </summary>
public interface IPlanAccessService
{
    /// <summary>
    /// O profissional tem a feature? Considera a assinatura individual ativa e, como fallback,
    /// qualquer clínica ativa a que ele pertença que ofereça o recurso.
    /// </summary>
    Task<bool> UserHasFeatureAsync(string userId, string feature, CancellationToken cancellationToken = default);

    /// <summary>A clínica tem a feature no seu plano ativo?</summary>
    Task<bool> TeamHasFeatureAsync(string teamId, string feature, CancellationToken cancellationToken = default);
}
