/**
 * Skeleton de carregamento do Hub da Clínica (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /teams` → `GET /teams/{id}` (ou o fallback
 * `MOCK_CLINIC`).
 *
 * Espelha o layout final de `team/page.tsx`: sub-nav (tabs) + header (ícone + nome + link) + card de
 * profissionais com algumas linhas e a área de convite — mesmas alturas para evitar layout shift
 * (critério de aceite §7.1).
 */

import {
  ListItemSkeleton,
  SkeletonBlock,
} from "@/components/ui/skeletons"

export default function TeamLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Sub-nav Equipe · Financeiro (ClinicTabs). */}
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>

      {/* Header da clínica: ícone + nome + descrição + link público. */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
          <SkeletonBlock className="h-7 w-52" />
        </div>
        <SkeletonBlock className="h-4 w-72 max-w-full" />
        <SkeletonBlock className="h-3 w-48" />
      </header>

      {/* Card de profissionais: cabeçalho + linhas + rodapé (convite). */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-2 border-b border-border/60 px-5 py-4 sm:px-6">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-3 border-t border-border/60 bg-muted/30 px-5 py-5 sm:px-6">
          <SkeletonBlock className="h-4 w-40" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SkeletonBlock className="h-11 flex-1 rounded-xl" />
            <SkeletonBlock className="h-11 w-28 rounded-xl" />
            <SkeletonBlock className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
