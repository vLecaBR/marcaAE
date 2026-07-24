using MarcaAi.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Email;

/// <summary>
/// Implementação de dev: registra o magic link no log em vez de enviar e-mail.
/// TODO: substituir por envio real via Resend (RESEND_API_KEY) na etapa de e-mails.
/// </summary>
public sealed class LoggingMagicLinkSender(ILogger<LoggingMagicLinkSender> logger) : IMagicLinkSender
{
    public Task SendAsync(string email, string magicLinkUrl, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("\n===== MAGIC LINK (DEV) =====\nPara: {Email}\nLink: {Url}\n============================", email, magicLinkUrl);
        return Task.CompletedTask;
    }
}
