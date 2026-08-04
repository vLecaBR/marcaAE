/**
 * Dashboard Financeiro (Fase 5 · spec §6). Rota: `/dashboard/financeiro`. Guarda: `requireOnboarded()`.
 *
 * Visão consolidada de métricas de negócio (MRR · Churn · LTV) + gráfico de faturamento.
 *
 * Leitura em RSC (ADR-0001): `GET /finance/summary` — dados reais projetados dos snapshots de
 * `Booking` (Q5). Sem movimentação (série vazia) → empty state neutro, nunca números inventados.
 */

import { redirect } from "next/navigation"
import { BarChart3 } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { EmptyState } from "@/components/ui/empty-state"
import { MetricCards } from "@/components/finance/metric-cards"
import { RevenueChart } from "@/components/finance/revenue-chart"
import type { FinanceDashboardDto } from "@/lib/api/finance-types"

export const metadata = { title: "Financeiro · MarcaAí" }

export default async function FinanceiroPage() {
  await requireOnboarded()

  let data: FinanceDashboardDto | null = null
  try {
    data = await serverApiFetch<FinanceDashboardDto>(endpoints.finance.summary)
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
    // Falha de leitura → trata como sem dados (empty state), nunca números inventados.
  }

  const hasData = !!data && data.revenueSeries.length > 0

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe a saúde do negócio: receita recorrente, retenção e faturamento.
        </p>
      </header>

      {hasData ? (
        <>
          <MetricCards summary={data!.summary} />
          <RevenueChart series={data!.revenueSeries} />
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Nenhuma movimentação ainda"
          description="Assim que você receber sua primeira consulta paga, suas métricas e o gráfico de faturamento aparecem aqui."
        />
      )}
    </div>
  )
}
