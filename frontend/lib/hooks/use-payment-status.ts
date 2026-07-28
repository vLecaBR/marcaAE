"use client"

/**
 * `usePaymentStatus(uid)` — acompanha a confirmação assíncrona de pagamento (ADR-0002).
 *
 * A confirmação (`PAID`) chega por webhook no backend; o cliente descobre por **polling** de
 * `GET /api/book/{uid}` com **backoff progressivo** (2s → 3s → 5s → 8s, teto ~90s). A fonte da
 * verdade é sempre o `paymentStatus` do backend — nunca estado otimista.
 *
 * A interface é desenhada para ser trocável: uma implementação futura por SSE pode substituir o
 * polling sem alterar quem consome o hook.
 */

import { useEffect, useRef, useState } from "react"
import type { BookingStatusPollDto, PaymentStatusName } from "@/lib/api/booking-types"

export type PaymentPhase = "idle" | "polling" | "paid" | "failed" | "timeout"

export interface PaymentStatusState {
  phase: PaymentPhase
  paymentStatus: PaymentStatusName | null
  bookingStatus: string | null
}

/** Sequência de intervalos (ms); o último valor se repete até o teto. */
const BACKOFF_MS = [2000, 3000, 5000, 5000, 8000]
const MAX_DURATION_MS = 90_000

const TERMINAL: PaymentStatusName[] = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED"]

export function usePaymentStatus(uid: string | null, enabled: boolean): PaymentStatusState {
  const [state, setState] = useState<PaymentStatusState>({
    phase: enabled ? "polling" : "idle",
    paymentStatus: null,
    bookingStatus: null,
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!uid || !enabled) {
      setState((s) => ({ ...s, phase: "idle" }))
      return
    }

    let cancelled = false
    let attempt = 0
    const startedAt = Date.now()
    setState({ phase: "polling", paymentStatus: null, bookingStatus: null })

    const finalPhase = (ps: PaymentStatusName): PaymentPhase => {
      if (ps === "PAID") return "paid"
      if (ps === "FAILED") return "failed"
      return "polling" // reembolsos mantêm a UI informando; tratados como terminal abaixo
    }

    async function tick() {
      if (cancelled) return
      try {
        const res = await fetch(`/api/book/${uid}`, { credentials: "same-origin", cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as BookingStatusPollDto
          const ps = data.paymentStatus
          if (!cancelled && TERMINAL.includes(ps)) {
            setState({ phase: finalPhase(ps) === "polling" ? "paid" : finalPhase(ps), paymentStatus: ps, bookingStatus: data.status })
            return
          }
          if (!cancelled) {
            setState((s) => ({ ...s, paymentStatus: ps, bookingStatus: data.status }))
          }
        }
      } catch {
        // Falha transitória de rede: ignora e tenta de novo no próximo intervalo.
      }

      if (cancelled) return
      if (Date.now() - startedAt >= MAX_DURATION_MS) {
        setState((s) => ({ ...s, phase: "timeout" }))
        return
      }
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
      attempt += 1
      timer.current = setTimeout(tick, delay)
    }

    // Primeira checagem quase imediata (o pagamento pode já ter sido confirmado).
    timer.current = setTimeout(tick, 800)

    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [uid, enabled])

  return state
}
