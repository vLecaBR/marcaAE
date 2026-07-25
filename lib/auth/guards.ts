import "server-only"

/**
 * Guardas de rota do frontend — espelham as policies do backend .NET
 * (`Onboarded`, `TeamOwner`, `TeamManager`, spec §2).
 *
 * Princípio: a **autorização real é do backend**. Estes guardas são camada de UX —
 * evitam renderizar telas que o usuário não pode ver e redirecionam cedo. Para papéis de
 * equipe, em vez de reimplementar a regra, fazemos um **probe**: chamamos o endpoint protegido
 * e deixamos o backend decidir (403 → sem acesso). Assim a policy vive num lugar só.
 */

import { redirect, notFound } from "next/navigation"
import { getMe } from "@/lib/api/session"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { MeDto } from "@/lib/api/types"

/** Exige sessão válida. Sem sessão → `/login`. */
export async function requireUser(): Promise<MeDto> {
  const user = await getMe()
  if (!user) redirect("/login")
  return user
}

/**
 * Exige sessão + onboarding concluído (policy `Onboarded`).
 * Sem sessão → `/login`; logado mas sem onboarding → `/onboarding`.
 */
export async function requireOnboarded(): Promise<MeDto> {
  const user = await requireUser()
  if (!user.onboarded) redirect("/onboarding")
  return user
}

/** Papel mínimo exigido numa equipe. `manager` cobre owner+manager; `owner` só owner. */
export type TeamRole = "owner" | "manager"

/**
 * DTO parcial de equipe. `role` é o papel do usuário atual na equipe, quando o backend o expõe.
 * Se ausente, confiamos apenas no resultado do probe (200 = tem acesso).
 */
export interface TeamDto {
  id: string
  name?: string
  slug?: string
  role?: "OWNER" | "MANAGER" | "MEMBER"
}

/**
 * Exige acesso a uma equipe com papel mínimo (policies `TeamOwner` / `TeamManager`).
 *
 * Faz um probe em `GET /teams/{id}`:
 *  - `401` → `/login`  ·  `403`/`404` → `notFound()` (não vaza existência da equipe);
 *  - se o DTO trouxer `role`, valida o papel mínimo localmente (defesa em profundidade).
 */
export async function requireTeamAccess(teamId: string, min: TeamRole = "manager"): Promise<TeamDto> {
  await requireUser()
  let team: TeamDto
  try {
    team = await serverApiFetch<TeamDto>(endpoints.teams.byId(teamId))
  } catch (err) {
    if (isApiError(err)) {
      if (err.kind === "unauthorized") redirect("/login")
      if (err.kind === "forbidden" || err.kind === "not_found") notFound()
    }
    throw err
  }

  if (team.role) {
    const rank = { MEMBER: 0, MANAGER: 1, OWNER: 2 } as const
    const needed = min === "owner" ? rank.OWNER : rank.MANAGER
    if (rank[team.role] < needed) notFound()
  }

  return team
}
