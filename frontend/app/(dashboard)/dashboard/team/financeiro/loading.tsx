/**
 * Skeleton de carregamento do Financeiro da Clínica (Fase 7 · spec §7.1). App Router: renderiza
 * instantaneamente enquanto a página RSC resolve `GET /teams` → `GET /finance/teams/{id}/summary`
 * (ou o fallback de demonstração).
 *
 * Espelha o layout final de `team/financeiro/page.tsx`: tabs + header + 4 cards de resumo + strip
 * de plano + tabela de receita por profissional — mesmas alturas/colunas para evitar layout shift
 * perceptível (critério de aceite §7.1).
 */

import { SkeletonBlock, TableRowSkeleton } from "@/components/ui/skeletons"

export default function TeamFinanceLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Sub-nav Equipe · Financeiro (ClinicTabs). */}
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>

      {/* Header: ícone + título + apoio. */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
          <SkeletonBlock className="h-7 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </header>

      {/* Resumo: 4 cards (grid-cols-2 lg:4). */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-5 shadow-sm ${
              i === 0 ? "border-brand-primary/30 bg-brand-primary/5" : "border-border/60 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-4 w-4 rounded" />
            </div>
            <SkeletonBlock className="mt-3 h-7 w-24" />
            <SkeletonBlock className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Strip de plano/fee. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-40" />
            <SkeletonBlock className="h-3 w-52 max-w-full" />
          </div>
        </div>
        <SkeletonBlock className="h-3 w-56 max-w-full" />
      </div>

      {/* Tabela de receita por profissional. */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-2 border-b border-border/60 px-5 py-4 sm:px-6">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-3 w-64 max-w-full" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
