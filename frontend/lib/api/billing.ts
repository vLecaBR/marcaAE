/**
 * Leitura de billing em RSC — Fase 8 / Q6.
 *
 * `server-only`: usa `serverApiFetch` direto (ADR-0001). A **API e a sessão ditam o plano** de ponta
 * a ponta. Enquanto `GET /teams/{teamId}/billing` não expõe o contrato completo (planCode/trial/
 * usage/limits), caímos para um **default neutro do plano free (Solo, sem trial)** — nunca um mock
 * de demonstração. Assim, um usuário free não recebe premium por flag legada de trial (ver Q6).
 */

import "server-only"

import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { getPlanConfig, BASE_PLAN_CODE } from "@/lib/plans/plan-config"
import type { TeamBillingDto } from "@/lib/api/billing-types"
import type { TeamSummaryDto } from "@/lib/api/types"

export interface BillingResult {
  billing: TeamBillingDto
}

/** Default neutro do plano free (Solo): sem trial, limites do próprio Solo, uso zerado. */
function soloDefaultBilling(teamId: string): TeamBillingDto {
  const solo = getPlanConfig(BASE_PLAN_CODE)
  return {
    teamId,
    planCode: BASE_PLAN_CODE,
    status: "INACTIVE",
    active: false,
    currentPeriodEnd: null,
    trial: { isTrialing: false, trialEndsAt: null, daysRemaining: null },
    usage: { bookingsThisMonth: 0, membersCount: 0, eventTypesCount: 0 },
    limits: solo.limits,
  }
}

/** O payload traz o contrato completo de plano/trial? Senão, usamos o default neutro. */
function isFullBilling(b: Partial<TeamBillingDto> | null | undefined): b is TeamBillingDto {
  return !!b && !!b.planCode && !!b.trial && !!b.limits && !!b.usage
}

/** Billing de uma clínica específica. Sem contrato completo / falha → default neutro do Solo. */
export async function getTeamBilling(teamId: string): Promise<BillingResult> {
  try {
    const b = await serverApiFetch<Partial<TeamBillingDto>>(endpoints.teams.billing(teamId))
    return { billing: isFullBilling(b) ? b : soloDefaultBilling(teamId) }
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") return { billing: soloDefaultBilling(teamId) }
    return { billing: soloDefaultBilling(teamId) }
  }
}

/** Billing **individual** do profissional (Solo/Solo Pro) — `GET /user/billing` (Q7). */
export async function getUserBilling(): Promise<BillingResult> {
  try {
    const b = await serverApiFetch<Partial<TeamBillingDto>>(endpoints.userBilling.root)
    return { billing: isFullBilling(b) ? b : soloDefaultBilling("") }
  } catch {
    return { billing: soloDefaultBilling("") }
  }
}

/**
 * Billing do usuário para o layout (nav/trial). Se pertence a uma clínica, usa o billing dela;
 * senão, usa o billing individual real (Solo/Solo Pro). Sem nada → default neutro do Solo.
 */
export async function getPrimaryTeamBilling(): Promise<BillingResult> {
  try {
    const teams = (await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root)) ?? []
    if (teams.length > 0) return getTeamBilling(teams[0].id)
    return getUserBilling()
  } catch {
    return getUserBilling()
  }
}
