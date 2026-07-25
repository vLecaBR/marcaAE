using MarcaAi.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Email;

/// <summary>Fallback de dev: registra o e-mail no console em vez de enviar.</summary>
public sealed class LoggingEmailClient(ILogger<LoggingEmailClient> logger) : IEmailClient
{
    public Task SendAsync(string to, string subject, string html, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("\n===== EMAIL (DEV) =====\nPara: {To}\nAssunto: {Subject}\n(HTML de {Len} chars)\n=======================", to, subject, html.Length);
        return Task.CompletedTask;
    }
}
