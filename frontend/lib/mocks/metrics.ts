/**
 * Mocks do Dashboard Financeiro — Fase 5 (temporário).
 *
 * O `FinanceController` do backend ainda não expõe métricas de negócio. Enquanto isso, o painel
 * `/dashboard/financeiro` consome estes dados para ficar visualmente completo e funcional. A
 * assinatura é a definitiva (`lib/api/finance-types.ts`) — trocar por `serverApiFetch` não altera
 * a UI.
 *
 * ⚠️ REMOVER ao plugar o backend real (grep por `MOCK_` / docs/backend-backlog.md §4.2).
 */

import type {
  FinanceDashboardDto,
  MetricsSummaryDto,
  RevenuePointDto,
} from "@/lib/api/finance-types"

/** 12 meses de faturamento com tendência de crescimento (para o gráfico). */
export const MOCK_REVENUE_SERIES: RevenuePointDto[] = [
  { month: "2025-08", grossCents: 4_120_00, netCents: 3_890_00, newMrrCents: 620_00 },
  { month: "2025-09", grossCents: 4_540_00, netCents: 4_290_00, newMrrCents: 710_00 },
  { month: "2025-10", grossCents: 5_010_00, netCents: 4_720_00, newMrrCents: 680_00 },
  { month: "2025-11", grossCents: 5_680_00, netCents: 5_360_00, newMrrCents: 900_00 },
  { month: "2025-12", grossCents: 6_920_00, netCents: 6_540_00, newMrrCents: 1_180_00 },
  { month: "2026-01", grossCents: 6_310_00, netCents: 5_960_00, newMrrCents: 540_00 },
  { month: "2026-02", grossCents: 7_040_00, netCents: 6_650_00, newMrrCents: 820_00 },
  { month: "2026-03", grossCents: 7_880_00, netCents: 7_450_00, newMrrCents: 970_00 },
  { month: "2026-04", grossCents: 8_450_00, netCents: 7_990_00, newMrrCents: 900_00 },
  { month: "2026-05", grossCents: 9_210_00, netCents: 8_710_00, newMrrCents: 1_050_00 },
  { month: "2026-06", grossCents: 10_040_00, netCents: 9_500_00, newMrrCents: 1_120_00 },
  { month: "2026-07", grossCents: 11_280_00, netCents: 10_680_00, newMrrCents: 1_340_00 },
]

export const MOCK_METRICS_SUMMARY: MetricsSummaryDto = {
  currency: "BRL",
  period: "2026-07",
  mrrCents: 11_280_00,
  arrCents: 135_360_00,
  mrrGrowthPct: 12.4,
  churnRatePct: 2.1,
  ltvCents: 2_940_00,
  arpuCents: 79_00,
  activeSubscriptions: 143,
  newSubscriptions: 21,
  canceledSubscriptions: 3,
}

export const MOCK_FINANCE_DASHBOARD: FinanceDashboardDto = {
  summary: MOCK_METRICS_SUMMARY,
  revenueSeries: MOCK_REVENUE_SERIES,
}
