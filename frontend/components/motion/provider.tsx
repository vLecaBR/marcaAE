"use client"

/**
 * Provider de animação leve.
 *
 * - `LazyMotion` + `domAnimation` carrega só o subconjunto DOM do motion (~5kb) em vez do
 *   bundle completo — casa com a meta de "bundle leve / performance impecável (mobile first)".
 * - `strict` proíbe o uso de `motion.*` (que reintroduz o bundle cheio); usamos `m.*`.
 * - `MotionConfig reducedMotion="user"` respeita `prefers-reduced-motion` automaticamente:
 *   quem pede menos movimento recebe transições sem deslocamento.
 */

import { LazyMotion, domAnimation, MotionConfig } from "motion/react"
import type { ReactNode } from "react"

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
