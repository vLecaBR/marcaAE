/**
 * Skeleton da tela de Disponibilidade (Fase 8.5 · §8.5.4 — completa a pendência §7.1). Espelha
 * `settings/availability/page.tsx`: header + card com linhas de dias da semana. Paleta clara Teal.
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

export default function AvailabilityLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>

      <div className="max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="divide-y divide-border/60">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-5 w-9 rounded-full" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-9 w-24 rounded-lg" />
                <SkeletonBlock className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
