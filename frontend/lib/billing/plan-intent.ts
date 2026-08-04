/**
 * Retenção de intenção de plano ("lost intent") — Q8.
 *
 * Quando um visitante clica num plano pago na landing, o `planCode` viaja por querystring
 * (`/login?plan=SOLO_PRO`) e é guardado no `localStorage` até o usuário concluir auth/onboarding.
 * Assim que ele chega ao dashboard, o `CheckoutIntentRunner` lê essa intenção e dispara o checkout
 * do Stripe automaticamente, sem precisar reabrir a tela de planos. Helpers client-side, SSR-safe.
 */

import { getPlanConfig, isPaidPlan, type PlanCode } from "@/lib/plans/plan-config"

/** Chave única do `localStorage`. */
export const PLAN_INTENT_KEY = "marcaai_pending_plan"

/** É um `PlanCode` **pago** válido (o único que faz sentido reter para checkout)? */
export function isValidPaidPlan(value: string | null | undefined): value is PlanCode {
  return !!value && isPaidPlan(value)
}

/** Salva a intenção (só planos pagos válidos). No-op fora do browser / em erro de storage. */
export function savePlanIntent(plan: string | null | undefined): void {
  if (typeof window === "undefined" || !isValidPaidPlan(plan)) return
  try {
    window.localStorage.setItem(PLAN_INTENT_KEY, plan)
  } catch {
    /* storage indisponível (modo privado etc.) — degrada sem quebrar */
  }
}

/** Lê a intenção salva, se ainda for um plano pago válido; senão `null`. */
export function readPlanIntent(): PlanCode | null {
  if (typeof window === "undefined") return null
  try {
    const v = window.localStorage.getItem(PLAN_INTENT_KEY)
    return isValidPaidPlan(v) ? v : null
  } catch {
    return null
  }
}

/** Limpa a intenção (chamada após disparar o checkout). */
export function clearPlanIntent(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PLAN_INTENT_KEY)
  } catch {
    /* no-op */
  }
}

/** Trilha do plano retido (define qual checkout disparar: individual vs clínica). */
export function planIntentAudience(plan: PlanCode) {
  return getPlanConfig(plan).audience
}
