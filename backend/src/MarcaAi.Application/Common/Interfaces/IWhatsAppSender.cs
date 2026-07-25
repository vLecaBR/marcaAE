namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Envio de mensagem WhatsApp. Impl: Evolution API ou log no console (dev).</summary>
public interface IWhatsAppSender
{
    Task SendAsync(string phone, string text, CancellationToken cancellationToken = default);
}
