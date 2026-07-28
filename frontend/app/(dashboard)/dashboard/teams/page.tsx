import type { Metadata } from "next"
import { TeamList } from "./components/team-list"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import type { TeamSummaryDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Clínicas" }

/**
 * Clínicas do profissional — via API .NET (`GET /teams`).
 * A lista da API traz `role` (papel do usuário) e `memberCount`; sintetizamos o array de membros
 * apenas para o card exibir o papel e a contagem (detalhe completo em `/teams/{id}`).
 */
export default async function TeamsPage() {
  const me = await requireOnboarded()
  const teams = await serverApiFetch<TeamSummaryDto[]>(endpoints.teams.root).catch(
    () => [] as TeamSummaryDto[],
  )

  const mapped = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    theme: t.theme,
    brandColor: t.brandColor,
    // Sintetiza membros: índice 0 = usuário atual (com seu papel), demais são placeholders
    // apenas para a contagem visual. O detalhe real vem de GET /teams/{id}.
    members: Array.from({ length: Math.max(t.memberCount, 1) }, (_, i) =>
      i === 0
        ? { role: t.role, user: { id: me.id, name: me.username, image: null, email: me.email } }
        : { role: "MEMBER", user: { id: `_${i}`, name: null, image: null, email: "" } },
    ),
    _count: { eventTypes: 0 },
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Clínicas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua clínica, os profissionais e o financeiro compartilhado.
        </p>
      </div>

      <TeamList teams={mapped as never} currentUserId={me.id} />
    </div>
  )
}
