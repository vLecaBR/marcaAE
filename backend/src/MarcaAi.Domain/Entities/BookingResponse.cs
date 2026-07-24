namespace MarcaAi.Domain.Entities;

/// <summary>Resposta do paciente a uma pergunta do formulário. Tabela "booking_responses".</summary>
public class BookingResponse
{
    public string Id { get; set; } = default!;
    public string BookingId { get; set; } = default!;
    public string QuestionId { get; set; } = default!;
    public string Answer { get; set; } = default!;

    public Booking Booking { get; set; } = default!;
}
