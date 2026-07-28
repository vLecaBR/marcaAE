"use client"

/**
 * Skeletons reutilizáveis (Fase 7 · spec §7.1). Client component (usam `m.*` do LazyMotion —
 * ver components/motion/provider.tsx).
 *
 * Pulsação suave e elegante via Framer Motion (opacidade em loop), na paleta Teal
 * (`bg-brand-primary/10`). Preferimos animar opacidade em vez de `animate-pulse` do Tailwind para
 * uma respiração mais calma ("sensação clínica", spec §2.6/§2.7). `MotionConfig reducedMotion="user"`
 * já herdado do root mantém a opacidade suave sem deslocamento para quem pede menos movimento.
 *
 * Uso: componha estes blocos dentro dos `loading.tsx` das rotas, espelhando o esqueleto/altura do
 * conteúdo real para evitar layout shift perceptível (critério de aceite §7.1).
 */

import { m } from "motion/react"
import { cn } from "@/lib/utils"

/** Curva/ duração da respiração — lenta o suficiente para ser calma, viva o suficiente para sinalizar carregamento. */
const PULSE = { duration: 1.6, repeat: Infinity, ease: "easeInOut" } as const

/**
 * Bloco base de skeleton com pulsação Teal. Passe `className` com a altura/largura/raio do
 * elemento real que ele representa.
 */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <m.div
      aria-hidden="true"
      className={cn("rounded-md bg-brand-primary/10", className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.85, 0.5] }}
      transition={PULSE}
    />
  )
}

/** Card genérico (título + linhas de corpo). Espelha os cards `rounded-2xl border bg-card` do app. */
export function CardSkeleton({
  className,
  lines = 3,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-sm", className)}>
      <SkeletonBlock className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  )
}

/** Espelha `components/finance/metric-cards.tsx` (rótulo + ícone, valor grande, hint). */
export function MetricCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        featured ? "border-brand-primary/30 bg-brand-primary/5" : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBlock className="mt-4 h-7 w-32" />
      <SkeletonBlock className="mt-2 h-3 w-20" />
    </div>
  )
}

/** Linha de tabela densa (avatar/ícone + duas linhas de texto + valor à direita). */
export function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-5 py-3.5", className)}>
      <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-3.5 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="h-4 w-16 shrink-0" />
    </div>
  )
}

/** Item de lista (linha de membro/profissional): avatar + nome/e-mail + controle à direita. */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 space-y-1.5">
          <SkeletonBlock className="h-3.5 w-32" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
      </div>
      <SkeletonBlock className="h-9 w-24 rounded-lg pl-[3.25rem] sm:pl-0" />
    </div>
  )
}
