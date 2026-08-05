"use client"

/**
 * Captura a intenção de plano do querystring (`?plan=SOLO_PRO`) e a guarda em **cookie same-site +
 * localStorage** (Q8 / bug 1). O cookie é o carrier durável que sobrevive ao OAuth do Google.
 * Renderiza `null` — é só um efeito colateral. Deve ficar dentro de um `<Suspense>` porque usa
 * `useSearchParams` (exigência do Next para pré-render).
 */

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { savePlanIntentAll } from "@/lib/billing/plan-intent"

export function PlanIntentCapture() {
  const params = useSearchParams()

  useEffect(() => {
    const plan = params.get("plan")
    if (plan) savePlanIntentAll(plan)
  }, [params])

  return null
}
