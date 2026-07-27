/**
 * DTOs de Billing / Planos / Free Trial — Fase 8 (§8.1 e §8.2).
 *
 * Casa definitiva do `TeamBillingDto` (a versão mínima que vivia em `lib/api/types.ts` foi
 * reescrita aqui e é re-exportada de lá para compatibilidade com as telas legadas de billing).
 * Consumido de `GET /teams/{teamId}/billing` — enquanto o backend não finaliza o contrato de
 * plano/trial (gaps a abrir em `docs/backend-backlog.md`), a tela segue o padrão
 * **mock-com-fallback** (§2.4) via `MOCK_TEAM_BILLING` (`lib/mocks/billing.ts`).
 *
 * ⚠️ Fonte da verdade = backend (§2.5): o front nunca "libera" recurso nem calcula expiração de
 * trial; apenas **reflete** `status`/`isTrialing`/`limits`/`usage`. Valores em **centavos** (BRL).
 */

import type { PlanCode, PlanLimits } from "@/lib/plans/plan-config"

/**
 * Status da assinatura (espelha o ciclo do provedor de billing).
 * `TRIALING` = período de teste grátis ativo (§8.2). `active` derivado = TRIALING || ACTIVE.
 */
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INACTIVE"

/** Uso corrente do período — sempre calculado no servidor (o front nunca deriva/soma, §2.6). */
export interface PlanUsageDto {
  /** Agendamentos pagos no mês corrente. */
  bookingsThisMonth: number
  /** Membros ativos na clínica. */
  membersCount: number
  /** Tipos de consulta ativos. */
  eventTypesCount: number
}

/**
 * Estado do Free Trial de 30 dias (§8.2). O backend provisiona `trialEndsAt` na criação da
 * clínica e informa `daysRemaining`; o front apenas exibe e reage (badge, CTA, downgrade visual).
 */
export interface TrialStateDto {
  isTrialing: boolean
  /** ISO datetime do fim do trial (ex.: "2026-08-26T00:00:00Z"). `null` fora de trial. */
  trialEndsAt: string | null
  /** Dias restantes calculados no servidor. `null` fora de trial. */
  daysRemaining: number | null
}

/**
 * `GET /teams/{teamId}/billing` — estado de plano, assinatura, uso vs. limites e trial.
 *
 * Mantém os campos legados (`status`/`active`/`currentPeriodEnd`) para não quebrar as telas de
 * billing existentes, e adiciona plano/uso/limites/trial da Fase 8.
 */
export interface TeamBillingDto {
  teamId: string
  /** Plano vigente (base = SOLO). */
  planCode: PlanCode
  /** Status da assinatura. */
  status: SubscriptionStatus
  /** Conveniência: assinatura dá acesso (TRIALING || ACTIVE). Fonte: backend. */
  active: boolean
  /** Fim do período pago corrente (ISO). `null` se não houver assinatura paga. */
  currentPeriodEnd: string | null
  /** Estado do free trial (§8.2). */
  trial: TrialStateDto
  /** Uso corrente do período. */
  usage: PlanUsageDto
  /**
   * Limites vigentes. Autoritativo do backend; quando ausente, o front usa
   * `getPlanConfig(planCode).limits` como fallback (§8.1) — nunca inventa limites.
   */
  limits: PlanLimits
}
