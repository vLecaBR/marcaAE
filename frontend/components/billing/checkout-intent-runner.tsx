"use client"

/**
 * Dispara automaticamente o checkout do plano retido logo após o onboarding/login (Q8 / bug 1).
 *
 * Montado no layout do dashboard. Ao montar: resolve a intenção na ordem **cookie → querystring
 * (`?plan`) → localStorage** (ver `resolvePlanIntent`), tornando o disparo resistente ao OAuth do
 * Google. Se houver um plano pago válido e for possível concluir (individual, ou clínica com
 * `teamId`), chama a Server Action de checkout, limpa a intenção de **todos** os storages e
 * redireciona ao Stripe. Clínica sem `teamId` ainda → mantém a intenção para depois. Idempotente
 * (guarda contra re-disparo no strict mode).
 */

import { useEffect, useRef } from "react"
import {
  createCheckoutSessionAction,
  createUserCheckoutSessionAction,
} from "@/lib/actions/billing"
import {
  resolvePlanIntent,
  clearPlanIntentAll,
  planIntentAudience,
} from "@/lib/billing/plan-intent"

export function CheckoutIntentRunner({ primaryTeamId = "" }: { primaryTeamId?: string }) {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // evita duplo disparo (React strict mode)
    const plan = resolvePlanIntent()
    if (!plan) return

    const audience = planIntentAudience(plan)

    // Clínica sem clínica criada ainda → não dá para faturar; mantém a intenção para depois.
    if (audience === "clinic" && !primaryTeamId) return

    ran.current = true

    // Remove o `?plan` da URL (sem recarregar) para não re-disparar num reload se o checkout falhar.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("plan")) {
      const url = new URL(window.location.href)
      url.searchParams.delete("plan")
      window.history.replaceState(null, "", url.toString())
    }

    void (async () => {
      const result =
        audience === "individual"
          ? await createUserCheckoutSessionAction(plan)
          : await createCheckoutSessionAction(primaryTeamId)

      // Consumida a intenção (sucesso ou erro), limpa cookie + localStorage para não reabrir a cada load.
      clearPlanIntentAll()
      if ("url" in result) window.location.assign(result.url)
    })()
  }, [primaryTeamId])

  return null
}
