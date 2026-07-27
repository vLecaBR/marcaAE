/**
 * Skeleton de carregamento do Início (Fase 7 · spec §7.1). App Router: renderiza instantaneamente
 * enquanto a página RSC resolve `GET /bookings` (stats + próximas reuniões).
 *
 * Espelha o layout final de `dashboard/page.tsx`: header (saudação + CTA) + grade de 4 cards de
 * stats + grid de 3 colunas (card "Próximas reuniões" 2/3 + card de link 1/3) — mesmas
 * alturas/colunas para evitar layout shift perceptível (critério de aceite §7.1).
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-56" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-44 shrink-0 rounded-xl" />
      </div>

      {/* Stats: grid-cols-1 sm:2 md:4. */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-full rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <SkeletonBlock className="mt-4 h-7 w-12" />
            <SkeletonBlock className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card "Próximas reuniões" (ocupa 2/3). */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-40" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-3.5 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Card do link de agendamento (ocupa 1/3). */}
        <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-3 h-3 w-full" />
          <SkeletonBlock className="mt-1.5 h-3 w-2/3" />
          <SkeletonBlock className="mt-5 h-11 w-full rounded-xl" />
          <div className="mt-4 flex gap-2">
            <SkeletonBlock className="h-10 flex-1 rounded-xl" />
            <SkeletonBlock className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
