"use client"

/**
 * Primitivas de micro-interação reutilizáveis (usam `m.*` do LazyMotion — ver provider.tsx).
 * Transições curtas e sutis: opacidade + pequeno deslocamento. Nada de exageros.
 */

import { m } from "motion/react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Duração/curva padrão — sensação "calma clínica" (spec §4.1), rápida o suficiente p/ mobile. */
const EASE = [0.22, 1, 0.36, 1] as const // easeOutExpo-ish
const DURATION = 0.28

/** Fade + slide-up sutil na montagem. Ideal para cabeçalhos de página e seções. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 8,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: EASE, delay }}
    >
      {children}
    </m.div>
  )
}

/**
 * Container que escalona a entrada dos filhos `StaggerItem`.
 * Usa `whileInView` para animar só quando entra na viewport (barato em listas longas).
 */
export function Stagger({
  children,
  className,
  gap = 0.05,
}: {
  children: ReactNode
  className?: string
  gap?: number
}) {
  return (
    <m.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </m.div>
  )
}

/** Item de uma lista `Stagger`. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
      }}
    >
      {children}
    </m.div>
  )
}

/**
 * Realce de toque para elementos interativos (cards clicáveis).
 * `whileTap` dá feedback imediato — importante em mobile.
 */
export function Pressable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <m.div
      className={className}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15, ease: EASE }}
    >
      {children}
    </m.div>
  )
}
