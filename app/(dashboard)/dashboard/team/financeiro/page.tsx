/**
 * Financeiro da Clínica (Fase 6.2 · spec §6.2). Rota: `/dashboard/team/financeiro`.
 * Guarda: `requireOnboarded()` + RBAC por papel (OWNER/ADMIN). Membros comuns NÃO veem o
 * faturamento dos colegas — bloqueio por renderização condicional (a aba nem aparece para eles).
 *
 * Leitura em RSC (ADR-0001): resolve a clínica principal via `GET /teams` e busca o consolidado em
 * `GET /finance/teams/{teamId}/summary`. Como o `FinanceController` ainda não está finalizado
 * (docs/backend-backlog.md), cai para dados de demonstração (`MOCK_TEAM_FINANCE`) com o selo
 * "Dados de demonstração". Plugar o backend real é só deixar de usar o mock.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FlaskConical, Building2, Lock, ArrowLeft } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { ClinicTabs } from "@/components/team/clinic-tabs"
import { TeamFinanceSummary } from "@/components/finance/team-finance-summary"
import { ProfessionalRevenueList } from "@/components/finance/professional-revenue-list"
import { PremiumGate } from "@/components/billing/premium-gate"
import { getTeamBilling } from "@/lib/api/billing"
import { MOCK_CLINIC } from "@/lib/mocks/team"
import { MOCK_TEAM_FINANCE } from "@/lib/mocks/team-finance"
import type { TeamFinanceSummaryDto } from "@/lib/api/finance-types"
import type { TeamDetailDto, TeamRoleName, TeamSummaryDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Financeiro da clínica · MarcaAí" }

export default async function TeamFinancePage() {
  await requireOnboarded()

  // Resolve a clínica principal e o papel do usuário nela.
  let teamId = MOCK_CLINIC.id
  let clinicName = MOCK_CLINIC.name
  let role: TeamRoleName = MOCK_CLINIC.role
  let hasRealClinic = false

  try {
    const teams = (await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root)) ?? []
    if (teams.length > 0) {
      const detail = await serverApiFetch<TeamDetailDto>(endpoints.teams.byId(teams[0].id))
      teamId = detail.id
      clinicName = detail.name
      role = detail.role
      hasRealClinic = true
    }
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
  }

  const canSeeFinance = role === "OWNER" || role === "ADMIN"

  // Estado de plano/trial da clínica (fallback mock §2.4) — o financeiro consolidado é feature premium.
  const { billing } = await getTeamBilling(teamId)

  // RBAC: membro comum não vê o faturamento dos colegas.
  if (!canSeeFinance) {
    return (
      <div className="max-w-4xl space-y-6">
        <ClinicTabs canSeeFinance={false} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">Acesso restrito</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            O faturamento da clínica fica visível apenas para proprietários e administradores. Fale
            com quem gerencia a clínica se precisar destes dados.
          </p>
          <Link
            href="/dashboard/team"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a equipe
          </Link>
        </div>
      </div>
    )
  }

  // Consolidado financeiro (com fallback para demonstração).
  let finance: TeamFinanceSummaryDto = MOCK_TEAM_FINANCE
  let isDemo = true
  if (hasRealClinic) {
    try {
      const res = await serverApiFetch<TeamFinanceSummaryDto>(endpoints.finance.teamSummary(teamId))
      if (res?.byProfessional) {
        finance = res
        isDemo = false
      }
    } catch (err) {
      if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
      // FinanceController ainda não finalizado → mantém a demonstração.
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <ClinicTabs canSeeFinance />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <h1 className="truncate text-2xl font-semibold">Financeiro · {clinicName}</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Consolidado de receita da clínica e o quanto cada profissional gerou no período.
          </p>
        </div>

        {isDemo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            <FlaskConical className="h-3.5 w-3.5" />
            Dados de demonstração
          </span>
        )}
      </header>

      {/* Gating premium (§8.1): liberado no trial (§8.2) ou em plano pago; senão, card de upgrade. */}
      <PremiumGate
        feature="team_finance"
        billing={billing}
        title="Financeiro da clínica é um recurso premium"
        description="Acompanhe o consolidado da clínica e a receita por profissional. Disponível nos planos Clínica e Pro — ou durante o seu teste grátis."
      >
        <div className="space-y-6">
          <TeamFinanceSummary summary={finance} />
          <ProfessionalRevenueList summary={finance} />
        </div>
      </PremiumGate>

      {isDemo && (
        <p className="text-center text-xs text-muted-foreground">
          Os números acima são ilustrativos. Assim que o backend financeiro (FinanceController) for
          concluído, esta tela passa a refletir dados reais automaticamente.
        </p>
      )}
    </div>
  )
}
