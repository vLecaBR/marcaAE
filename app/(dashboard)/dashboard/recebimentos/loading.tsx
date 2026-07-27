/**
 * Skeleton de carregamento de Recebimentos (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /payouts` (ou o fallback de demonstração).
 *
 * Espelha o layout final de `recebimentos/page.tsx`: header + card de status da conta +
 * transparência de taxas + card de atalho para o financeiro — mesmas alturas para evitar layout
 * shift perceptível (critério de aceite §7.1).
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

export default function RecebimentosLoading() {
  return (
    <div className="max-w-4xl space-y-8">
      <header className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </header>

      {/* Card de status da conta (PayoutStatusCard): badge + texto + CTA. */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-52" />
            <SkeletonBlock className="h-3.5 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-6 w-20 shrink-0 rounded-full" />
        </div>
        <SkeletonBlock className="mt-5 h-10 w-48 rounded-xl" />
      </div>

      {/* Transparência de taxas (FeeTransparency). */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <SkeletonBlock className="h-4 w-40" />
        <div className="mt-4 space-y-2.5">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-5/6" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
      </div>

      {/* Atalho para o painel financeiro. */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-36" />
            <SkeletonBlock className="h-3 w-56 max-w-full" />
          </div>
        </div>
        <SkeletonBlock className="h-4 w-4 shrink-0 rounded" />
      </div>
    </div>
  )
}
