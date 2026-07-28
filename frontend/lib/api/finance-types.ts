/**
 * DTOs do Dashboard Financeiro (Fase 5 · spec §6).
 *
 * O `FinanceController` do backend ainda não está finalizado (docs/backend-backlog.md §4.2), então
 * hoje estes dados vêm de mock (`lib/mocks/metrics.ts`) com fallback gracioso na página. A
 * assinatura já é a definitiva: ao plugar o backend, troca-se a fonte por `serverApiFetch` sem
 * tocar na UI. Todos os valores monetários são **centavos** (BRL); a agregação é sempre do
 * servidor — o front nunca soma centavos (spec §6.3).
 */

import type { TeamRoleName } from "@/lib/api/types"

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

// ---------------------------------------------------------------------------
// Fase 6.2 — Financeiro da Clínica (`GET /finance/teams/{teamId}/summary`).
// Consolidado por clínica: líquido total, receita por profissional e plano/fee vigente.
// Snapshot imutável do Booking projetado no servidor (§4.2 do backlog) — o front nunca soma.
// ---------------------------------------------------------------------------

/** Receita líquida gerada por um profissional da clínica no período. */
export interface ProfessionalRevenueDto {
  userId: string
  name: string | null
  /** Papel na clínica (para exibir o selo). */
  role: TeamRoleName
  /** Líquido do profissional (Σ NetToProviderCents de bookings PAID). */
  netCents: number
  /** Nº de consultas pagas no período. */
  paidBookingsCount: number
  /**
   * Rateio interno ("sua fatia") — v2, depende de `RevenueShareRule` (backlog §Futuro).
   * Ausente por ora; a coluna é apenas reservada na UI.
   */
  shareCents?: number | null
}

/** Plano/fee vigente da clínica (quanto maior o plano, menor o fee — spec §6.2). */
export interface TeamPlanDto {
  /** SOLO | CLINICA | PRO. */
  planCode: string
  /** Assentos contratados. */
  quantity: number
  /** Fee padrão em basis points (ex.: 249 = 2,49%). */
  defaultFeeBps: number
}

/** Resposta consumida por `/dashboard/team/financeiro`. */
export interface TeamFinanceSummaryDto {
  teamId: string
  currency: "BRL"
  /** Período de referência legível (ex.: "Julho de 2026"). */
  period: string
  /** Líquido total da clínica no período. */
  netTotalCents: number
  /** Taxas MarcaAí retidas no período. */
  platformFeesCents: number
  /** Ticket médio das consultas pagas. */
  avgTicketCents: number
  /** Total de consultas pagas no período. */
  paidBookingsCount: number
  byProfessional: ProfessionalRevenueDto[]
  plan: TeamPlanDto
}
