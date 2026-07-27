/**
 * Dashboard Financeiro (Fase 5 · spec §6). Rota: `/dashboard/financeiro`. Guarda: `requireOnboarded()`.
 *
 * Visão consolidada de métricas de negócio (MRR · Churn · LTV) + gráfico de faturamento.
 *
 * Leitura em RSC (ADR-0001): tenta `GET /finance/summary`. Como o `FinanceController` ainda não
 * está finalizado (docs/backend-backlog.md §4.2), cai para dados de demonstração com fallback
 * gracioso — a UI e as chamadas já são as definitivas; plugar o backend é só remover o mock.
 * Um selo "Dados de demonstração" deixa claro que os números não são reais.
 */

import { redirect } from "next/navigation"
import { FlaskConical } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { MetricCards } from "@/components/finance/metric-cards"
import { RevenueChart } from "@/components/finance/revenue-chart"
import { MOCK_FINANCE_DASHBOARD } from "@/lib/mocks/metrics"
import type { FinanceDashboardDto } from "@/lib/api/finance-types"

export const metadata = { title: "Financeiro · MarcaAí" }

export default async function FinanceiroPage() {
  await requireOnboarded()

  let data: FinanceDashboardDto = MOCK_FINANCE_DASHBOARD
  let isDemo = true
  try {
    const res = await serverApiFetch<FinanceDashboardDto>(endpoints.finance.summary)
    if (res?.summary) {
      data = res
      isDemo = false
    }
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
    // Backend ainda não finalizado (§4.2) → mantém a demonstração.
  }

  return (
    <div className="max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a saúde do negócio: receita recorrente, retenção e faturamento.
          </p>
        </div>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            <FlaskConical className="h-3.5 w-3.5" />
            Dados de demonstração
          </span>
        )}
      </header>

      <MetricCards summary={data.summary} />

      <RevenueChart series={data.revenueSeries} />

      {isDemo && (
        <p className="text-center text-xs text-muted-foreground">
          Os números acima são ilustrativos. Assim que o backend financeiro for concluído, esta tela
          passa a refletir dados reais automaticamente.
        </p>
      )}
    </div>
  )
}
