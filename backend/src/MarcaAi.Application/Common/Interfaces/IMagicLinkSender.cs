namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Envia o link de acesso (magic link) por e-mail. Em dev, registra o link no log.</summary>
public interface IMagicLinkSender
{
    Task SendAsync(string email, string magicLinkUrl, CancellationToken cancellationToken = default);
}
