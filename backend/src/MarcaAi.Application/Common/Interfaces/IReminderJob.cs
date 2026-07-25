namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Job recorrente: dispara lembretes das consultas próximas (anti no-show).</summary>
public interface IReminderJob
{
    Task DispatchDueAsync(CancellationToken cancellationToken = default);
}
