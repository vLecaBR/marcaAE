using MarcaAi.Domain.Enums;

namespace MarcaAi.Domain.Entities;

/// <summary>Consulta/Sessão agendada. Tabela "bookings".</summary>
public class Booking
{
    public string Id { get; set; } = default!;
    public string Uid { get; set; } = default!;        // id público (URL de confirmação)
    public string UserId { get; set; } = default!;     // profissional dono da agenda
    public string EventTypeId { get; set; } = default!;

    // Dados do paciente
    public string GuestName { get; set; } = default!;
    public string GuestEmail { get; set; } = default!;
    public string? GuestPhone { get; set; }
    public string? GuestNotes { get; set; }

    // Janela sempre em UTC
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string GuestTimeZone { get; set; } = default!;

    public BookingStatus Status { get; set; } = BookingStatus.PENDING;

    public string? CancelReason { get; set; }
    public DateTime? CanceledAt { get; set; }
    public CanceledBy? CanceledBy { get; set; }

    public string? MeetingUrl { get; set; }
    public string? MeetingId { get; set; }

    public bool ReminderSent { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.UNPAID;
    public string? PaymentReference { get; set; }

    public string? RecurringEventId { get; set; }
    public int? RecurringIndex { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Owner { get; set; } = default!;
    public EventType EventType { get; set; } = default!;
    public ICollection<BookingResponse> Responses { get; set; } = new List<BookingResponse>();
}
