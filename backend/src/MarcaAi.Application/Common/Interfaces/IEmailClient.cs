namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Primitivo de envio de e-mail (HTML). Impl: Resend ou log no console (dev).</summary>
public interface IEmailClient
{
    Task SendAsync(string to, string subject, string html, CancellationToken cancellationToken = default);
}
