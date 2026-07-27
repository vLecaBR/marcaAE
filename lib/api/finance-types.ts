/**
 * DTOs do Dashboard Financeiro (Fase 5 · spec §6).
 *
 * O `FinanceController` do backend ainda não está finalizado (docs/backend-backlog.md §4.2), então
 * hoje estes dados vêm de mock (`lib/mocks/metrics.ts`) com fallback gracioso na página. A
 * assinatura já é a definitiva: ao plugar o backend, troca-se a fonte por `serverApiFetch` sem
 * tocar na UI. Todos os valores monetários são **centavos** (BRL); a agregação é sempre do
 * servidor — o front nunca soma centavos (spec §6.3).
 */

export type TrendDirection = "up" | "down" | "flat"

/**
 * Métricas consolidadas de negócio (visão SaaS). Fonte proposta: `GET /finance/summary`.
 * MRR/Churn/LTV são a espinha dorsal do painel (pedido do produto).
 */
export interface MetricsSummaryDto {
  currency: "BRL"
  /** Período de referência (ISO date, ex.: "2026-07"). */
  period: string
  /** Receita recorrente mensal. */
  mrrCents: number
  /** Receita recorrente anual (≈ MRR × 12). */
  arrCents: number
  /** Variação percentual do MRR vs. mês anterior (ex.: 8.4 = +8,4%). */
  mrrGrowthPct: number
  /** Churn de receita no mês (ex.: 2.1 = 2,1%). */
  churnRatePct: number
  /** Lifetime Value médio por cliente. */
  ltvCents: number
  /** Receita média por conta ativa (ARPU). */
  arpuCents: number
  /** Assinaturas ativas no fim do período. */
  activeSubscriptions: number
  /** Novas assinaturas no período. */
  newSubscriptions: number
  /** Cancelamentos no período. */
  canceledSubscriptions: number
}

/** Ponto da série mensal de faturamento — alimenta o gráfico (spec §6.1). */
export interface RevenuePointDto {
  /** ISO "YYYY-MM". */
  month: string
  /** Faturamento bruto processado no mês. */
  grossCents: number
  /** Líquido após taxas de gateway/estornos. */
  netCents: number
  /** Novo MRR adicionado no mês. */
  newMrrCents: number
}

/** Resposta agregada consumida pela página `/dashboard/financeiro`. */
export interface FinanceDashboardDto {
  summary: MetricsSummaryDto
  revenueSeries: RevenuePointDto[]
}
