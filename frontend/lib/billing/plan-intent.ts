/**
 * Retenção de intenção de plano ("lost intent") — Q8 / bug 1.
 *
 * Quando um visitante clica num plano pago na landing, o `planCode` viaja por querystring
 * (`/login?plan=SOLO_PRO`) e é retido até o usuário concluir auth/onboarding. Assim que ele chega
 * ao dashboard, o `CheckoutIntentRunner` lê essa intenção e dispara o checkout do Stripe.
 *
 * Bug 1: `localStorage` sozinho é frágil no OAuth do Google (round-trip Vercel↔Render↔Google, com
 * possível particionamento de storage / landing em rota diferente). Por isso a intenção passa a ser
 * gravada **também num cookie same-site** (`mai_plan`), que: (a) é legível server-side no
 * `/auth/callback` do front, e (b) sobrevive ao ciclo de auth. O cookie é a fonte durável; o
 * `localStorage` e o `?plan` da URL são fallbacks. Helpers client-side, SSR-safe.
 */

import { getPlanConfig, isPaidPlan, type PlanCode } from "@/lib/plans/plan-config"

/** Chave única do `localStorage`. */
export const PLAN_INTENT_KEY = "marcaai_pending_plan"

/** Nome do cookie same-site (não-HttpOnly: precisa ser lido pelo runner no client). */
export const PLAN_INTENT_COOKIE = "mai_plan"

/** TTL do cookie (30 min) — cobre o fluxo de auth/onboarding sem persistir indefinidamente. */
const COOKIE_MAX_AGE_SECONDS = 30 * 60

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

/** Limpa a intenção do `localStorage`. */
export function clearPlanIntent(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PLAN_INTENT_KEY)
  } catch {
    /* no-op */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie same-site (bug 1) — carrier durável através do OAuth. Lido também server-side.
// ─────────────────────────────────────────────────────────────────────────────

/** Grava a intenção num cookie same-site (só planos pagos válidos). No-op fora do browser. */
export function savePlanIntentCookie(plan: string | null | undefined): void {
  if (typeof document === "undefined" || !isValidPaidPlan(plan)) return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie =
    `${PLAN_INTENT_COOKIE}=${encodeURIComponent(plan)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

/** Lê a intenção do cookie, se ainda for um plano pago válido; senão `null`. */
export function readPlanIntentCookie(): PlanCode | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${PLAN_INTENT_COOKIE}=`))
  if (!match) return null
  const value = decodeURIComponent(match.slice(PLAN_INTENT_COOKIE.length + 1))
  return isValidPaidPlan(value) ? value : null
}

/** Remove o cookie de intenção (expira imediatamente). */
export function clearPlanIntentCookie(): void {
  if (typeof document === "undefined") return
  document.cookie = `${PLAN_INTENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

/**
 * Resolve a intenção na ordem de confiabilidade do bug 1: **cookie → querystring (`?plan`) →
 * localStorage**. O cookie sobrevive ao OAuth; o `?plan` cobre o repasse direto do `/auth/callback`;
 * o localStorage é o fallback legado.
 */
export function resolvePlanIntent(): PlanCode | null {
  const fromCookie = readPlanIntentCookie()
  if (fromCookie) return fromCookie

  if (typeof window !== "undefined") {
    const fromQuery = new URLSearchParams(window.location.search).get("plan")
    if (isValidPaidPlan(fromQuery)) return fromQuery
  }

  return readPlanIntent()
}

/** Limpa a intenção em **todos** os storages (cookie + localStorage). Chamada após o disparo. */
export function clearPlanIntentAll(): void {
  clearPlanIntentCookie()
  clearPlanIntent()
}

/** Persiste a intenção em cookie **e** localStorage (belt-and-suspenders no clique/captura). */
export function savePlanIntentAll(plan: string | null | undefined): void {
  savePlanIntent(plan)
  savePlanIntentCookie(plan)
}

/** Trilha do plano retido (define qual checkout disparar: individual vs clínica). */
export function planIntentAudience(plan: PlanCode) {
  return getPlanConfig(plan).audience
}
