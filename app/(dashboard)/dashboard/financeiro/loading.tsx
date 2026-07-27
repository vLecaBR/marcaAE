/**
 * Skeleton de carregamento do Dashboard Financeiro (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /finance/summary` (ou o fallback mock).
 *
 * Espelha o layout final de `financeiro/page.tsx`: header + grade de 6 MetricCards + área do
 * gráfico de faturamento — mesmas alturas/colunas para evitar layout shift (critério de aceite §7.1).
 */

import {
  MetricCardSkeleton,
  SkeletonBlock,
} from "@/components/ui/skeletons"

export default function FinanceiroLoading() {
  return (
    <div className="max-w-5xl space-y-8">
      <header className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </header>

      {/* Grade de métricas — espelha MetricCards (grid-cols-1 sm:2 lg:3, 6 cards). */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCardSkeleton featured />
        {Array.from({ length: 5 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Área do gráfico de faturamento (recharts). */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="mt-5 h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}
