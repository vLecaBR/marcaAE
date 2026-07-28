/**
 * Skeleton da tela de Planos (Fase 8.5 · §8.5.4 — completa a pendência §7.1). App Router: renderiza
 * enquanto a página RSC resolve `GET /teams` → billing (ou fallback mock §2.4).
 *
 * Espelha `team/plans/page.tsx`: sub-nav (tabs) + header + grade de 3 cards de plano — mesmas alturas
 * para evitar layout shift (critério §7.1). Paleta clara Teal via primitivas de skeleton.
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

export default function PlansLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Sub-nav (ClinicTabs). */}
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>

      {/* Header: voltar + título + descrição. */}
      <header className="space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-7 w-64" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </header>

      {/* Grade de 3 planos. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={
              i === 1
                ? "flex flex-col rounded-2xl border border-brand-primary/40 bg-brand-primary/5 p-6 shadow-sm md:-mt-2"
                : "flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            }
          >
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="mt-3 h-9 w-32" />
            <div className="mt-5 flex-1 space-y-2.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <SkeletonBlock key={j} className={j === 3 ? "h-3 w-2/3" : "h-3 w-full"} />
              ))}
            </div>
            <SkeletonBlock className="mt-6 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
