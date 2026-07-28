"use client"

/**
 * Modal leve com `AnimatePresence` — entrada/saída animadas do backdrop e do painel.
 * Acessível: fecha com Esc e clique no backdrop, `role="dialog"`, trava o scroll do body.
 * Para formulários complexos, preferir o Dialog do Radix; este é o caminho leve para
 * confirmações/detalhes (spec §4.4).
 */

import { AnimatePresence, m } from "motion/react"
import { useEffect, type ReactNode } from "react"

const EASE = [0.22, 1, 0.36, 1] as const

export function MotionModal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, ease: EASE }}
          >
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
