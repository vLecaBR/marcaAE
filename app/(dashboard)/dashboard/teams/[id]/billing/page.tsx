import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { CheckoutButton } from "./components/checkout-button"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { TeamDetailDto, TeamBillingDto } from "@/lib/api/types"

export default async function TeamBillingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOnboarded()
  const { id } = await params

  let team: TeamDetailDto
  try {
    team = await serverApiFetch<TeamDetailDto>(endpoints.teams.byId(id))
  } catch (err) {
    if (isApiError(err) && (err.kind === "not_found" || err.kind === "forbidden")) notFound()
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
    throw err
  }

  const billing = await serverApiFetch<TeamBillingDto>(endpoints.teams.billing(id)).catch(() => null)
  const isOwner = team.role === "OWNER"
  const isSubscribed = billing?.active ?? false

  const FEATURES = [
    "Agendamentos ilimitados",
    "Profissionais ilimitados na clínica",
    "Split de pagamento (PIX/Cartão) automático",
    "Lembretes automáticos via WhatsApp",
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/teams/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Faturamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o plano e os pagamentos da clínica {team.name}.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">Plano da clínica</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Agendamento coletivo, split de pagamentos, relatórios financeiros e suporte prioritário.
            </p>
            <div className="mt-6 space-y-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 md:w-72">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Mensalidade
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$</span>
              <span className="text-5xl font-black tracking-tight">49</span>
              <span className="text-sm font-medium text-muted-foreground">/mês</span>
            </div>

            {isSubscribed ? (
              <div className="mt-6 w-full rounded-lg bg-care/10 py-2.5 text-center text-sm font-medium text-care flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Plano ativo
              </div>
            ) : (
              <div className="mt-6 w-full rounded-lg bg-warning/10 py-2.5 text-center text-sm font-medium text-warning flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" /> Pagamento pendente
              </div>
            )}

            <div className="mt-4 w-full">
              {isOwner ? (
                <CheckoutButton teamId={team.id} isSubscribed={isSubscribed} />
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Apenas o proprietário pode gerenciar a assinatura.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
