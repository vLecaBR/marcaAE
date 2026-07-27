"use server"

/**
 * Recebimentos (PayoutAccount) — Server Actions-proxy finas (padrão ADR-0001, igual a
 * `lib/actions/billing.ts`). Chamam `serverApiFetch` e normalizam para `{ ... } | { error }`.
 * Migrar ao BFF (`/api/bff/payouts/*`) é follow-up de baixo risco — a allowlist já cobre `payouts`.
 *
 * Sem SDK do Stripe/Mercado Pago no front: a API decide o provedor e devolve a `onboardingUrl`
 * (Stripe Connect Express / Mercado Pago) para redirecionarmos o profissional.
 */

import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { PaymentProvider, PayoutOnboardingResponse } from "@/lib/api/payout-types"

/**
 * Inicia (ou retoma) o cadastro da conta de recebimento no provedor.
 * @returns `{ onboardingUrl }` para redirecionar, ou `{ error }` amigável.
 */
export async function startPayoutOnboardingAction(
  provider: PaymentProvider = "STRIPE",
): Promise<{ onboardingUrl: string } | { error: string }> {
  try {
    const res = await serverApiFetch<PayoutOnboardingResponse>(endpoints.payouts.onboarding, {
      method: "POST",
      body: { provider },
    })
    if (!res?.onboardingUrl) {
      return { error: "Não foi possível iniciar o cadastro de recebimentos. Tente novamente." }
    }
    return { onboardingUrl: res.onboardingUrl }
  } catch (err) {
    if (isApiError(err)) {
      if (err.kind === "unauthorized") return { error: "Sua sessão expirou. Entre novamente." }
      return { error: err.problem.detail || "Falha ao iniciar o cadastro de recebimentos." }
    }
    throw err
  }
}

/** Desvincula uma conta de recebimento. `{ success }` | `{ error }`. */
export async function unlinkPayoutAction(
  payoutId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await serverApiFetch<null>(endpoints.payouts.byId(payoutId), { method: "DELETE" })
    return { success: true }
  } catch (err) {
    if (isApiError(err)) {
      if (err.kind === "forbidden") return { error: "Você não pode desvincular esta conta." }
      return { error: err.problem.detail || "Falha ao desvincular a conta de recebimento." }
    }
    throw err
  }
}
