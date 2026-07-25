namespace MarcaAi.Domain.Enums;

/// <summary>Status do pagamento antecipado (sinal/integral) e do split. PG enum "PaymentStatus".</summary>
/// <remarks>
/// Ordem preservada nos 3 primeiros valores (UNPAID, PAID, REFUNDED) por compatibilidade com dados existentes.
/// Novos estados adicionados ao final para suportar o fluxo de split de marketplace (ver financial-split-spec.md §5.1).
/// </remarks>
public enum PaymentStatus { UNPAID, PAID, REFUNDED, PENDING, PARTIALLY_REFUNDED, FAILED }
