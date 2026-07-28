/**
 * Skeleton da tela de Perfil (Fase 8.5 · §8.5.4 — completa a pendência §7.1). Espelha
 * `settings/profile/page.tsx`: header + card de formulário. Paleta clara Teal.
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="max-w-3xl space-y-5 rounded-2xl border border-border/60 bg-card p-7 shadow-sm">
        {/* Avatar + identidade. */}
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>

        {/* Campos do formulário. */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-28" />
            <SkeletonBlock className="h-11 w-full rounded-xl" />
          </div>
        ))}

        <SkeletonBlock className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  )
}
