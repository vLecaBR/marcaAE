/**
 * Skeleton de carregamento de Tipos de consulta (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /event-types` (+ `GET /teams`).
 *
 * Espelha o layout final de `event-types/page.tsx` + `EventTypeList`: header (título + apoio) +
 * botão "Novo serviço" à direita + card com linhas de serviço divididas — mesmas alturas para
 * evitar layout shift perceptível (critério de aceite §7.1).
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

/** Linha de serviço: ícone/cor + título/descrição + duração/preço + ação. */
function EventTypeRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-3.5 w-44" />
        <SkeletonBlock className="h-3 w-64 max-w-full" />
      </div>
      <SkeletonBlock className="hidden h-3.5 w-20 sm:block" />
      <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
    </div>
  )
}

export default function EventTypesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>

      {/* Botão "Novo serviço" (alinhado à direita, igual à lista). */}
      <div className="flex justify-end">
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>

      <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventTypeRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
