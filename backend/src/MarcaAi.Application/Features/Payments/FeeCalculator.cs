namespace MarcaAi.Application.Features.Payments;

/// <summary>Parâmetros de entrada para o cálculo da taxa de um split. Todos os valores monetários em centavos.</summary>
/// <param name="GrossCents">Valor bruto da consulta (preço cheio pago pelo paciente).</param>
/// <param name="FeePercentBps">Percentual da taxa MarcaAí em basis points (250 = 2,5%).</param>
/// <param name="FeeFixedCents">Componente fixo da taxa MarcaAí, em centavos.</param>
/// <param name="GatewayCostCents">Custo cobrado pelo gateway na transação, em centavos (0 se desconhecido).</param>
/// <param name="AbsorbGatewayCost">
/// Se true, o MarcaAí absorve o custo do gateway (sai da fee da plataforma) e o provedor recebe bruto − fee.
/// Se false (padrão v1), o profissional/clínica absorve o custo do gateway (deduzido do líquido).
/// </param>
public readonly record struct FeeInput(
    int GrossCents,
    int FeePercentBps,
    int FeeFixedCents,
    int GatewayCostCents = 0,
    bool AbsorbGatewayCost = false);

/// <summary>Resultado imutável do cálculo de um split. Todos os valores em centavos.</summary>
/// <param name="GrossCents">Valor bruto.</param>
/// <param name="PlatformFeeCents">Taxa retida pelo MarcaAí.</param>
/// <param name="GatewayFeeCents">Custo do gateway registrado (para auditoria).</param>
/// <param name="NetToProviderCents">Valor líquido repassado ao profissional/clínica.</param>
public readonly record struct FeeBreakdown(
    int GrossCents,
    int PlatformFeeCents,
    int GatewayFeeCents,
    int NetToProviderCents);

/// <summary>Resultado do cálculo de um reembolso proporcional. Valores em centavos.</summary>
/// <param name="RefundToPatientCents">Total devolvido ao paciente.</param>
/// <param name="PlatformFeeReturnedCents">Parte da taxa MarcaAí devolvida (proporcional).</param>
/// <param name="NetReversedFromProviderCents">Parte revertida do líquido do profissional/clínica.</param>
public readonly record struct RefundBreakdown(
    int RefundToPatientCents,
    int PlatformFeeReturnedCents,
    int NetReversedFromProviderCents);

/// <summary>
/// Cálculo puro e determinístico da taxa de split e de reembolsos. Sem I/O e sem dependências:
/// projetado para ser 100% testável em unidade. Regras em financial-split-spec.md §4.2 e §6.3.
/// </summary>
public static class FeeCalculator
{
    private const int BpsDenominator = 10_000;

    /// <summary>Calcula a divisão de um pagamento (taxa da plataforma + líquido ao provedor).</summary>
    /// <exception cref="ArgumentOutOfRangeException">Se algum parâmetro for negativo ou o percentual exceder 100%.</exception>
    /// <exception cref="InvalidOperationException">Se a taxa + custo do gateway exceder o valor bruto (configuração inválida).</exception>
    public static FeeBreakdown Compute(FeeInput input)
    {
        if (input.GrossCents < 0)
            throw new ArgumentOutOfRangeException(nameof(input.GrossCents), "Valor bruto não pode ser negativo.");
        if (input.FeePercentBps < 0 || input.FeePercentBps > BpsDenominator)
            throw new ArgumentOutOfRangeException(nameof(input.FeePercentBps), "Percentual deve estar entre 0 e 10000 bps (0–100%).");
        if (input.FeeFixedCents < 0)
            throw new ArgumentOutOfRangeException(nameof(input.FeeFixedCents), "Taxa fixa não pode ser negativa.");
        if (input.GatewayCostCents < 0)
            throw new ArgumentOutOfRangeException(nameof(input.GatewayCostCents), "Custo do gateway não pode ser negativo.");

        // Percentual com arredondamento comercial (metade para cima), somado ao componente fixo.
        int percentPart = (int)Math.Round(
            input.GrossCents * (decimal)input.FeePercentBps / BpsDenominator,
            MidpointRounding.AwayFromZero);
        int platformFee = percentPart + input.FeeFixedCents;

        // Quem absorve o custo do gateway define se ele reduz o líquido do provedor.
        int gatewayDeduction = input.AbsorbGatewayCost ? 0 : input.GatewayCostCents;
        int netToProvider = input.GrossCents - platformFee - gatewayDeduction;

        if (netToProvider < 0)
            throw new InvalidOperationException(
                "Taxa da plataforma + custo do gateway excedem o valor bruto. Revise a configuração de taxas.");

        return new FeeBreakdown(
            GrossCents: input.GrossCents,
            PlatformFeeCents: platformFee,
            GatewayFeeCents: input.GatewayCostCents,
            NetToProviderCents: netToProvider);
    }

    /// <summary>
    /// Calcula um reembolso proporcional: a taxa da plataforma é devolvida na mesma proporção do valor reembolsado
    /// (política aprovada — financial-split-spec.md §10.5). Reembolso total devolve 100% da taxa.
    /// </summary>
    /// <param name="original">Divisão original do pagamento.</param>
    /// <param name="refundAmountCents">Valor a reembolsar ao paciente (0..Gross).</param>
    /// <exception cref="ArgumentOutOfRangeException">Se o valor do reembolso for negativo ou exceder o bruto.</exception>
    public static RefundBreakdown ComputeRefund(FeeBreakdown original, int refundAmountCents)
    {
        if (refundAmountCents < 0)
            throw new ArgumentOutOfRangeException(nameof(refundAmountCents), "Valor de reembolso não pode ser negativo.");
        if (refundAmountCents > original.GrossCents)
            throw new ArgumentOutOfRangeException(nameof(refundAmountCents), "Reembolso não pode exceder o valor bruto.");

        if (original.GrossCents == 0)
            return new RefundBreakdown(0, 0, 0);

        decimal proportion = (decimal)refundAmountCents / original.GrossCents;

        int platformFeeReturned = (int)Math.Round(
            original.PlatformFeeCents * proportion,
            MidpointRounding.AwayFromZero);

        // O restante do reembolso sai do líquido que foi para o profissional/clínica.
        int netReversed = refundAmountCents - platformFeeReturned;

        return new RefundBreakdown(
            RefundToPatientCents: refundAmountCents,
            PlatformFeeReturnedCents: platformFeeReturned,
            NetReversedFromProviderCents: netReversed);
    }
}
