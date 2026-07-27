/**
 * Visão da Clínica (Fase 6 · spec §7 / plano de ação). Rota: `/dashboard/team`.
 * Guarda: `requireOnboarded()` (o RBAC fino por clínica é enforçado pelo backend).
 *
 * Leitura em RSC (ADR-0001): resolve a clínica principal do profissional via `GET /teams` →
 * `GET /teams/{id}` (detalhe + membros + papel do usuário). Quando o profissional ainda não tem
 * clínica, ou a API está indisponível, cai para dados de demonstração (`MOCK_CLINIC`) com o selo
 * "Dados de demonstração" — a tela fica sempre renderizável. Plugar o backend real é só deixar de
 * usar o mock.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FlaskConical, ExternalLink, Building2, Layers, Hospital, Plus } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ClinicMembers } from "@/components/team/clinic-members"
import { ClinicTabs } from "@/components/team/clinic-tabs"
import { TeamUsageStats } from "@/components/billing/team-usage-stats"
import { getTeamBilling } from "@/lib/api/billing"
import { MOCK_CLINIC } from "@/lib/mocks/team"
import type { TeamDetailDto, TeamSummaryDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Clínica · MarcaAí" }

export default async function TeamPage() {
  const me = await requireOnboarded()

  let clinic: TeamDetailDto = MOCK_CLINIC
  let isDemo = true
  let otherClinics = 0
  // Distingue "a API respondeu e o usuário não tem clínica" (→ onboarding "Crie sua clínica")
  // de "a API está indisponível" (→ mantém a demonstração, tela sempre renderizável).
  let hasNoClinic = false

  try {
    const teams =
      (await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root)) ?? []
    if (teams.length > 0) {
      const primary = teams[0]
      clinic = await serverApiFetch<TeamDetailDto>(endpoints.teams.byId(primary.id))
      isDemo = false
      otherClinics = teams.length - 1
    } else {
      hasNoClinic = true
    }
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
    // Backend indisponível → mantém a demonstração.
  }

  // Onboarding: usuário real ainda sem clínica → empty state acolhedor (spec §7.2 / §8.2).
  if (hasNoClinic) {
    return (
      <div className="max-w-4xl space-y-6">
        <ClinicTabs canSeeFinance={false} />
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <EmptyState
            icon={Hospital}
            title="Crie sua clínica"
            description="Reúna sua equipe em um só lugar: convide profissionais, defina papéis e acompanhe o financeiro compartilhado. Toda nova clínica começa com 30 dias de teste grátis."
            action={
              <Button asChild className="rounded-xl gap-1.5">
                <Link href="/dashboard/teams">
                  <Plus size={16} /> Crie sua clínica
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const currentUserId = isDemo ? MOCK_CLINIC.members[0].userId : me.id
  const canSeeFinance = clinic.role === "OWNER" || clinic.role === "ADMIN"

  // Uso vs. limites do plano (fallback mock §2.4). Só gestores veem billing/limites.
  const { billing } = await getTeamBilling(clinic.id)

  return (
    <div className="max-w-4xl space-y-6">
      <ClinicTabs canSeeFinance={canSeeFinance} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <h1 className="truncate text-2xl font-semibold">{clinic.name}</h1>
          </div>
          {clinic.description && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{clinic.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <a
              href={`/team/${clinic.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-primary hover:underline"
            >
              marcaai.app/team/{clinic.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
            {otherClinics > 0 && (
              <Link
                href="/dashboard/teams"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Layers className="h-3 w-3" />
                Ver todas as clínicas ({otherClinics + 1})
              </Link>
            )}
          </div>
        </div>

        {isDemo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            <FlaskConical className="h-3.5 w-3.5" />
            Dados de demonstração
          </span>
        )}
      </header>

      {canSeeFinance && <TeamUsageStats billing={billing} />}

      <ClinicMembers
        teamId={clinic.id}
        members={clinic.members}
        currentUserRole={clinic.role}
        currentUserId={currentUserId}
        isDemo={isDemo}
      />

      {isDemo && (
        <p className="text-center text-xs text-muted-foreground">
          Esta é uma clínica de demonstração. Assim que você criar ou entrar em uma clínica real,
          esta tela passa a refletir os profissionais e papéis verdadeiros automaticamente.
        </p>
      )}
    </div>
  )
}
