"use server"

/**
 * Assinatura da clínica — proxy fino para `POST /teams/{id}/billing/checkout` (Fase 5).
 * A API decide entre checkout novo e portal do cliente e retorna `{ url }`. Sem Prisma/Stripe SDK.
 * Retorno mantido como `{ url }` | `{ error }` para o `CheckoutButton`.
 */

import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"

export async function createCheckoutSessionAction(
  teamId: string,
): Promise<{ url: string } | { error: string }> {
  try {
    const res = await serverApiFetch<{ url: string }>(endpoints.teams.billingCheckout(teamId), {
      method: "POST",
    })
    if (!res?.url) return { error: "Não foi possível gerar o link de pagamento." }
    return { url: res.url }
  } catch (err) {
    if (isApiError(err)) {
      if (err.kind === "forbidden") return { error: "Apenas o dono da clínica pode assinar." }
      return { error: err.problem.detail || "Falha ao gerar o link de pagamento." }
    }
    throw err
  }
}
