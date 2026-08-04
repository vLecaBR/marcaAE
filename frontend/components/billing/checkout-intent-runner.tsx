"use client"

/**
 * Dispara automaticamente o checkout do plano retido logo após o onboarding/login (Q8).
 *
 * Montado no layout do dashboard. Ao montar: lê a intenção salva (`localStorage`); se houver um
 * plano pago válido e for possível concluir (individual, ou clínica com `teamId`), chama a Server
 * Action de checkout, limpa a intenção e redireciona ao Stripe. Clínica sem `teamId` ainda →
 * mantém a intenção (dispara quando a clínica existir). Idempotente (guarda contra re-disparo).
 */

import { useEffect, useRef } from "react"
import {
  createCheckoutSessionAction,
  createUserCheckoutSessionAction,
} from "@/lib/actions/billing"
import { readPlanIntent, clearPlanIntent, planIntentAudience } from "@/lib/billing/plan-intent"

export function CheckoutIntentRunner({ primaryTeamId = "" }: { primaryTeamId?: string }) {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // evita duplo disparo (React strict mode)
    const plan = readPlanIntent()
    if (!plan) return

    const audience = planIntentAudience(plan)

    // Clínica sem clínica criada ainda → não dá para faturar; mantém a intenção para depois.
    if (audience === "clinic" && !primaryTeamId) return

    ran.current = true
    void (async () => {
      const result =
        audience === "individual"
          ? await createUserCheckoutSessionAction(plan)
          : await createCheckoutSessionAction(primaryTeamId)

      // Consumida a intenção (sucesso ou erro), limpa para não reabrir em todo load.
      clearPlanIntent()
      if ("url" in result) window.location.assign(result.url)
    })()
  }, [primaryTeamId])

  return null
}
