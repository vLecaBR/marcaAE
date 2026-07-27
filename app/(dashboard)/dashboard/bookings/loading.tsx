/**
 * Skeleton de carregamento de Agendamentos (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /bookings`.
 *
 * Espelha o layout final de `bookings/page.tsx`: header + strip de tabs (Próximos · Pendentes ·
 * Passados · Cancelados) + card com linhas de agendamento divididas — mesmas alturas/colunas para
 * evitar layout shift perceptível (critério de aceite §7.1). Reutiliza `SkeletonBlock` das
 * primitivas (components/ui/skeletons).
 */

import { SkeletonBlock } from "@/components/ui/skeletons"

/** Linha de agendamento: avatar + nome/badge + e-mail + tipo de consulta + data + ação. */
function BookingRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <SkeletonBlock className="h-3.5 w-40" />
          <SkeletonBlock className="h-3 w-52 max-w-full" />
        </div>
      </div>

      {/* Tipo de consulta (visível apenas em sm+, igual à página). */}
      <SkeletonBlock className="hidden h-3.5 w-1/4 sm:block" />

      {/* Data/hora. */}
      <SkeletonBlock className="h-3.5 w-32 sm:w-1/4" />

      {/* Ações do agendamento. */}
      <SkeletonBlock className="h-9 w-24 shrink-0 rounded-lg" />
    </div>
  )
}

export default function BookingsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-56" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
      </div>

      {/* Strip de tabs: Próximos · Pendentes · Passados · Cancelados. */}
      <div className="flex gap-2 overflow-hidden rounded-xl bg-muted/40 p-1 sm:w-fit">
        {["w-24", "w-28", "w-24", "w-28"].map((w, i) => (
          <SkeletonBlock key={i} className={`h-9 ${w} rounded-lg`} />
        ))}
      </div>

      {/* Card de linhas (aba ativa "Próximos"). */}
      <div className="mt-5 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookingRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
