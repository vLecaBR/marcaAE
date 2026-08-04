/**
 * Tela de Planos / Upgrade **no contexto de clínica**. Rota: `/dashboard/team/plans` (dentro do
 * escopo `dashboard/team/**`, portanto protegida pelo gating de trilha clínica do Q2). Guarda:
 * `requireOnboarded()`.
 *
 * Q3: os CTAs de upgrade (`PremiumGate`/`TrialBanner`) agora apontam para a tela **neutra**
 * `/dashboard/plans` (`PLANS_ROUTE`). Esta tela permanece só para o contexto de clínica e, por isso,
 * mostra **apenas a trilha clínica** (CLINICA/CLINICA_PRO) via `plansByAudience("clinic")` — sem
 * poluir com planos individuais. Preços/limites 100% derivados de `PLAN_CONFIG` (§8.1); plano atual
 * pelo `TeamBillingDto` (fallback mock §2.4). CLINICA em destaque ("Popular").
 */

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { getTeamBilling } from "@/lib/api/billing"
import { ClinicTabs } from "@/components/team/clinic-tabs"
import { PlanActionButton } from "@/components/billing/plan-action-button"
import { formatBRLCents, cn } from "@/lib/utils"
import {
  getPlanConfig,
  plansByAudience,
  planFeatureLines,
} from "@/lib/plans/plan-config"
import type { TeamSummaryDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Planos · MarcaAí" }

/** Plano em destaque na pricing table. */
const RECOMMENDED_PLAN = "CLINICA"

export default async function PlansPage() {
  await requireOnboarded()

  // Resolve a clínica principal para o billing (com fallback mock §2.4).
  let teamId = "mock-clinic"
  try {
    const teams = (await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root)) ?? []
    if (teams.length > 0) teamId = teams[0].id
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") throw err
  }

  const { billing } = await getTeamBilling(teamId)
  const currentPlan = getPlanConfig(billing.planCode)
  const isTrialing = billing.trial.isTrialing
  const daysRemaining = billing.trial.daysRemaining ?? 0

  return (
    <div className="max-w-5xl space-y-6">
      <ClinicTabs canSeeFinance />

      <header className="min-w-0">
        <Link
          href="/dashboard/team"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a clínica
        </Link>
        <h1 className="text-2xl font-semibold">Planos e assinatura</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Quanto maior o plano, menor a taxa por consulta. Escolha o que melhor acompanha o
          crescimento da sua clínica.
        </p>
      </header>

      {isTrialing && (
        <div className="flex items-center gap-2.5 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Você está no <span className="font-semibold">teste grátis</span> —{" "}
            {daysRemaining <= 0
              ? "termina hoje"
              : `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`}
            . Escolha um plano para manter os recursos premium após o período.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        {plansByAudience("clinic").map((plan) => {
          const isCurrent = plan.planCode === currentPlan.planCode
          const isRecommended = plan.planCode === RECOMMENDED_PLAN
          const direction = plan.order > currentPlan.order ? "upgrade" : "downgrade"

          return (
            <div
              key={plan.planCode}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                isRecommended
                  ? "border-brand-primary ring-1 ring-brand-primary md:-mt-2 md:pb-8"
                  : "border-border/60",
              )}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-care/10 px-2.5 py-0.5 text-xs font-medium text-care">
                    <Check className="h-3 w-3" /> Seu plano atual
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                {plan.monthlyPriceCents === 0 ? (
                  <span className="text-3xl font-black tracking-tight">Grátis</span>
                ) : (
                  <>
                    <span className="text-3xl font-black tracking-tight">
                      {formatBRLCents(plan.monthlyPriceCents)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {planFeatureLines(plan).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="rounded-xl bg-muted py-2.5 text-center text-sm font-medium text-muted-foreground">
                    Plano ativo
                  </div>
                ) : (
                  <PlanActionButton
                    teamId={teamId}
                    targetPlan={plan.planCode}
                    direction={direction}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
