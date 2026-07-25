using System.Globalization;
using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Application.Features.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MarcaAi.Infrastructure.Notifications;

/// <summary>
/// Compõe e dispara notificações de consulta por e-mail (paciente + profissional) e WhatsApp.
/// Cada canal é best-effort e isolado — a falha de um não afeta o outro nem o fluxo de agendamento.
/// </summary>
public sealed class NotificationService(
    IEmailClient email, IWhatsAppSender whatsapp, IConfiguration config, ILogger<NotificationService> logger)
    : INotificationService
{
    private static readonly CultureInfo Br = new("pt-BR");
    private string AppUrl => (config["App:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');

    public async Task NotifyBookingCreatedAsync(BookingNotification n, CancellationToken ct = default)
    {
        var whenGuest = FormatWhen(n.StartTimeUtc, n.GuestTimeZone);
        var manageUrl = $"{AppUrl}/booking/{n.Uid}";

        if (n.RequiresConfirm)
        {
            await Email(n.GuestEmail, $"Solicitação recebida — {n.EventTitle}",
                Template($"Olá, {n.GuestName}!",
                    $"Sua solicitação de <b>{n.EventTitle}</b> com {n.OwnerName} foi enviada e aguarda confirmação.",
                    $"📅 Data sugerida: {whenGuest}", null, manageUrl, "Ver detalhes"), ct);
            await Whats(n.GuestPhone,
                $"Olá, *{n.GuestName}*! ⏳\n\nSua solicitação de *{n.EventTitle}* com {n.OwnerName} foi enviada e aguarda aprovação.\n\n📅 {whenGuest}\n\nAvisaremos quando for confirmada.", ct);
        }
        else
        {
            var meetLine = string.IsNullOrWhiteSpace(n.MeetingUrl) ? null : $"🔗 Acesso: {n.MeetingUrl}";
            await Email(n.GuestEmail, $"Consulta confirmada — {n.EventTitle}",
                Template($"Olá, {n.GuestName}!",
                    $"Sua consulta <b>{n.EventTitle}</b> com {n.OwnerName} está <b>confirmada</b>.",
                    $"📅 Quando: {whenGuest}", meetLine, manageUrl, "Gerenciar consulta"), ct);
            await Whats(n.GuestPhone,
                $"Olá, *{n.GuestName}*! 👋\n\nSua consulta de *{n.EventTitle}* com {n.OwnerName} está *CONFIRMADA*.\n\n📅 {whenGuest}" +
                (string.IsNullOrWhiteSpace(n.MeetingUrl) ? "" : $"\n🔗 {n.MeetingUrl}") +
                $"\n\nGerenciar: {manageUrl}", ct);
        }

        // Notifica o profissional
        var whenOwner = FormatWhen(n.StartTimeUtc, n.OwnerTimeZone);
        await Email(n.OwnerEmail, $"Nova consulta — {n.EventTitle}",
            Template("Você tem uma nova consulta",
                $"<b>{n.GuestName}</b> ({n.GuestEmail}) agendou <b>{n.EventTitle}</b>.",
                $"📅 {whenOwner}", n.GuestPhone is null ? null : $"📱 {n.GuestPhone}", null, null), ct);
    }

    public async Task NotifyBookingCancelledAsync(BookingNotification n, string? reason, CancellationToken ct = default)
    {
        var whenGuest = FormatWhen(n.StartTimeUtc, n.GuestTimeZone);
        await Email(n.GuestEmail, $"Consulta cancelada — {n.EventTitle}",
            Template($"Olá, {n.GuestName}.",
                $"A consulta <b>{n.EventTitle}</b> em {whenGuest} foi <b>cancelada</b>.",
                string.IsNullOrWhiteSpace(reason) ? null : $"Motivo: {reason}", null, null, null), ct);
        await Whats(n.GuestPhone,
            $"Olá, *{n.GuestName}*. ❌\n\nA consulta de *{n.EventTitle}* em {whenGuest} foi *CANCELADA*." +
            (string.IsNullOrWhiteSpace(reason) ? "" : $"\n\nMotivo: {reason}"), ct);
    }

    public async Task NotifyBookingReminderAsync(BookingNotification n, CancellationToken ct = default)
    {
        var whenGuest = FormatWhen(n.StartTimeUtc, n.GuestTimeZone);
        var manageUrl = $"{AppUrl}/booking/{n.Uid}";
        var meetLine = string.IsNullOrWhiteSpace(n.MeetingUrl) ? null : $"🔗 Acesso: {n.MeetingUrl}";
        await Email(n.GuestEmail, $"Lembrete — {n.EventTitle}",
            Template($"Lembrete, {n.GuestName}! ⏰",
                $"Você tem <b>{n.EventTitle}</b> com {n.OwnerName} em breve.",
                $"📅 {whenGuest}", meetLine, manageUrl, "Ver consulta"), ct);
        await Whats(n.GuestPhone,
            $"Lembrete! ⏰\n\nOlá, *{n.GuestName}*, você tem *{n.EventTitle}* com {n.OwnerName}.\n\n📅 {whenGuest}" +
            (string.IsNullOrWhiteSpace(n.MeetingUrl) ? "" : $"\n🔗 {n.MeetingUrl}"), ct);
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    private async Task Email(string to, string subject, string html, CancellationToken ct)
    {
        try { await email.SendAsync(to, subject, html, ct); }
        catch (Exception ex) { logger.LogError(ex, "[Notify] Falha no e-mail para {To}", to); }
    }

    private async Task Whats(string? phone, string text, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(phone)) return;
        try { await whatsapp.SendAsync(phone, text, ct); }
        catch (Exception ex) { logger.LogError(ex, "[Notify] Falha no WhatsApp para {Phone}", phone); }
    }

    private static string FormatWhen(DateTime utc, string tzId)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz);
            return local.ToString("dddd, dd/MM/yyyy 'às' HH:mm", Br);
        }
        catch { return utc.ToString("dd/MM/yyyy HH:mm 'UTC'", Br); }
    }

    private static string Template(string title, string body, string? line1, string? line2, string? url, string? cta)
    {
        var extra = string.Concat(
            line1 is null ? "" : $"<p style=\"margin:4px 0;color:#334155\">{line1}</p>",
            line2 is null ? "" : $"<p style=\"margin:4px 0;color:#334155\">{line2}</p>");
        var button = url is null || cta is null ? "" :
            $"<p style=\"margin:24px 0\"><a href=\"{url}\" style=\"background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block\">{cta}</a></p>";
        return $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
              <h2 style="margin:0 0 8px">{title}</h2>
              <p style="color:#475569">{body}</p>
              {extra}
              {button}
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">MarcaAí · agendamento para profissionais da saúde</p>
            </div>
            """;
    }
}
