using MarcaAi.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.WhatsApp;

/// <summary>Fallback de dev: registra a mensagem no console (modo simulado, como o Next).</summary>
public sealed class LoggingWhatsAppSender(ILogger<LoggingWhatsAppSender> logger) : IWhatsAppSender
{
    public Task SendAsync(string phone, string text, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("\n===== 🟢 WHATSAPP (SIMULADO) → {Phone} =====\n{Text}\n=========================================", phone, text);
        return Task.CompletedTask;
    }
}
