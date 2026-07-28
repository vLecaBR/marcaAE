/**
 * Leitura de billing em RSC com fallback gracioso — Fase 8 (§2.4 / §8).
 *
 * `server-only`: usa `serverApiFetch` direto (ADR-0001). Enquanto o contrato de plano/trial de
 * `GET /teams/{teamId}/billing` não está finalizado, cai para `MOCK_TEAM_BILLING` (trial de 30 dias)
 * com `isDemo: true` para a UI de trial/gating ficar sempre visível. Plugar o backend real é só o
 * endpoint passar a responder — a assinatura (`TeamBillingDto`) não muda.
 */

import "server-only"

import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { MOCK_TEAM_BILLING } from "@/lib/mocks/billing"
import type { TeamBillingDto } from "@/lib/api/billing-types"
import type { TeamSummaryDto } from "@/lib/api/types"

export interface BillingResult {
  billing: TeamBillingDto
  /** `true` quando os dados vêm do mock (backend indisponível/pendente) — dispara o selo "Demo". */
  isDemo: boolean
}

/** Billing de uma clínica específica, com fallback mock gracioso (§2.4). */
export async function getTeamBilling(teamId: string): Promise<BillingResult> {
  try {
    const billing = await serverApiFetch<TeamBillingDto>(endpoints.teams.billing(teamId))
    // Guarda defensiva: enquanto o backend não expõe o contrato novo (planCode/trial), usa o mock.
    if (billing?.trial && billing.planCode) return { billing, isDemo: false }
    return { billing: MOCK_TEAM_BILLING, isDemo: true }
  } catch (err) {
    // Auth já foi resolvida pela guarda da rota/layout; qualquer falha aqui → demonstração.
    if (isApiError(err) && err.kind === "unauthorized") return { billing: MOCK_TEAM_BILLING, isDemo: true }
    return { billing: MOCK_TEAM_BILLING, isDemo: true }
  }
}

/**
 * Resolve a clínica principal do usuário e seu billing — usado pelo banner de trial no layout,
 * que não conhece um `teamId`. Sem clínica real ainda → demonstração (a UI de trial permanece
 * visível durante o onboarding, coerente com o empty state "Crie sua clínica" da F7.2/§8.2).
 */
export async function getPrimaryTeamBilling(): Promise<BillingResult> {
  try {
    const teams = (await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root)) ?? []
    if (teams.length > 0) return getTeamBilling(teams[0].id)
    return { billing: MOCK_TEAM_BILLING, isDemo: true }
  } catch {
    return { billing: MOCK_TEAM_BILLING, isDemo: true }
  }
}
