namespace MarcaAi.Application.Features.Google;

/// <summary>Intervalo ocupado (UTC) retornado pelo FreeBusy do Google Calendar.</summary>
public sealed record GoogleBusySlot(DateTime Start, DateTime End);

/// <summary>Entrada para criar um evento no Google Calendar.</summary>
public sealed record CreateGoogleEventInput(
    string UserId,
    string Title,
    string Description,
    DateTime StartUtc,
    DateTime EndUtc,
    string GuestName,
    string GuestEmail,
    bool CreateMeetLink);

/// <summary>Resultado da criação do evento (id + link do Meet, se houver).</summary>
public sealed record GoogleEventResult(string EventId, string? MeetLink);
