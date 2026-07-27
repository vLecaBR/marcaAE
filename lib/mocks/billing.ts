/**
 * Mock de Billing — Fase 8 (temporário).
 *
 * O contrato de plano/trial de `GET /teams/{teamId}/billing` ainda não está finalizado (gaps a
 * abrir em `docs/backend-backlog.md`). Enquanto isso, `/dashboard/team` e a tela de billing
 * consomem este mock com fallback gracioso + selo "Dados de demonstração" (§2.4). A assinatura é a
 * definitiva (`TeamBillingDto`) — plugar o backend real é só deixar de usar o mock.
 *
 * Cenário: clínica **em free trial de 30 dias** (§8.2) — premium liberado via `isTrialing`, com
 * contagem regressiva ativa. Ajuste `daysRemaining`/`isTrialing` abaixo para testar os estados de
 * aviso (≤7 dias) e de expiração (downgrade + PremiumGate).
 *
 * ⚠️ REMOVER/ignorar ao plugar o backend (grep por `MOCK_` / docs/backend-backlog.md).
 */

import type { TeamBillingDto } from "@/lib/api/billing-types"
import { getPlanConfig } from "@/lib/plans/plan-config"

/** Clínica nova em trial: plano base SOLO, mas premium liberado pelos 30 dias de teste. */
export const MOCK_TEAM_BILLING: TeamBillingDto = {
  teamId: "mock-clinic",
  planCode: "SOLO",
  status: "TRIALING",
  active: true,
  currentPeriodEnd: null,
  trial: {
    isTrialing: true,
    // ~18 dias restantes de um trial de 30 dias (bom para exibir a contagem sem cair no aviso ≤7).
    trialEndsAt: "2026-08-14T00:00:00Z",
    daysRemaining: 18,
  },
  usage: {
    bookingsThisMonth: 23,
    membersCount: 4,
    eventTypesCount: 3,
  },
  // Durante o trial, os limites exibidos são os do plano base; o gating premium é liberado pelo trial.
  limits: getPlanConfig("SOLO").limits,
}
