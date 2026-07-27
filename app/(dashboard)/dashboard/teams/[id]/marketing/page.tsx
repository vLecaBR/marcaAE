import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QrCard } from "./components/qr-card"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { TeamDetailDto } from "@/lib/api/types"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

export default async function MarketingPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (team.role !== "OWNER" && team.role !== "ADMIN") {
    redirect(`/dashboard/teams/${team.id}`)
  }

  const teamUrl = `${APP_URL}/team/${team.slug}`

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4 print:hidden">
        <Link
          href={`/dashboard/teams/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Marketing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Materiais de balcão para facilitar o agendamento dos pacientes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:block">
        <div className="space-y-6 print:hidden">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Cartaz de mesa</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Imprima este QR Code e coloque no seu consultório. Ao apontar a câmera, o paciente vai
              direto para a página de agendamento da clínica.
            </p>
            <div className="mt-6">
              <QrCard teamName={team.name} url={teamUrl} />
            </div>
          </div>
        </div>

        <div className="hidden print:flex flex-col items-center justify-center min-h-screen">
          <QrCard teamName={team.name} url={teamUrl} isPrintView />
        </div>
      </div>
    </div>
  )
}
