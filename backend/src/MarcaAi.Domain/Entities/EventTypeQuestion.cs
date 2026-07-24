using MarcaAi.Domain.Enums;

namespace MarcaAi.Domain.Entities;

/// <summary>Pergunta do formulário público (anamnese/pré-consulta). Tabela "event_type_questions".</summary>
public class EventTypeQuestion
{
    public string Id { get; set; } = default!;
    public string EventTypeId { get; set; } = default!;
    public string Label { get; set; } = default!;
    public QuestionType Type { get; set; } = QuestionType.TEXT;
    public string? Placeholder { get; set; }
    public bool Required { get; set; }
    public int Order { get; set; }

    public EventType EventType { get; set; } = default!;
}
