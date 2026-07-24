namespace MarcaAi.Application.Features.Bookings;

public enum BookingOutcome { Success, EventNotFound, InvalidDuration, Unavailable, Conflict }

/// <summary>Confirmação de agendamento.</summary>
public sealed record BookingConfirmationDto(
    string Uid,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string Status,
    bool RequiresConfirm,
    string EventTitle,
    string? MeetingUrl);

public sealed record CreateBookingResult(
    BookingOutcome Outcome,
    BookingConfirmationDto? Data = null,
    string? Message = null)
{
    public static CreateBookingResult Success(BookingConfirmationDto data) => new(BookingOutcome.Success, data);
    public static CreateBookingResult EventNotFound() =>
        new(BookingOutcome.EventNotFound, Message: "Tipo de evento não encontrado ou inativo.");
    public static CreateBookingResult InvalidDuration(int expected) =>
        new(BookingOutcome.InvalidDuration, Message: $"Duração inválida. Esperado: {expected} min.");
    public static CreateBookingResult Unavailable() =>
        new(BookingOutcome.Unavailable, Message: "Este horário está fora da disponibilidade do profissional.");
    public static CreateBookingResult Conflict() =>
        new(BookingOutcome.Conflict, Message: "Este horário acabou de ser reservado. Escolha outro horário.");
}
