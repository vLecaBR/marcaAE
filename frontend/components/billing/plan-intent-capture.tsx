"use client"

/**
 * Captura a intenção de plano do querystring (`?plan=SOLO_PRO`) e a guarda no `localStorage` (Q8).
 * Renderiza `null` — é só um efeito colateral. Deve ficar dentro de um `<Suspense>` porque usa
 * `useSearchParams` (exigência do Next para pré-render).
 */

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { savePlanIntent } from "@/lib/billing/plan-intent"

export function PlanIntentCapture() {
  const params = useSearchParams()

  useEffect(() => {
    const plan = params.get("plan")
    if (plan) savePlanIntent(plan)
  }, [params])

  return null
}
