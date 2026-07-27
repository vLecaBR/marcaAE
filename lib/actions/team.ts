"use server"

/**
 * Clínicas/equipes — proxy fino para a API .NET (Fase 5). Sem Prisma/NextAuth.
 * O RBAC (OWNER/ADMIN) é enforçado pelo backend; aqui só relayamos e normalizamos erros.
 */

import { revalidatePath } from "next/cache"
import {
  teamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  type TeamInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "@/lib/validators/team"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { apiAction, callApi, type ActionResult } from "@/lib/api/action-helpers"
import type { TeamSummaryDto } from "@/lib/api/types"

export async function upsertTeamAction(
  raw: TeamInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = teamSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { id, ...data } = parsed.data
  const body = {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    logo: null,
    theme: data.theme ?? "LIGHT",
    brandColor: data.brandColor ?? null,
  }

  const result = await apiAction(async () => {
    if (id) {
      await serverApiFetch(endpoints.teams.byId(id), { method: "PUT", body })
      return { id, slug: data.slug }
    }
    const created = await serverApiFetch<TeamSummaryDto>(endpoints.teams.root, {
      method: "POST",
      body,
    })
    return { id: created?.id ?? "", slug: created?.slug ?? data.slug }
  }, "Erro ao salvar a clínica.")

  if (result.success) revalidatePath("/dashboard/teams")
  return result
}

export async function inviteTeamMemberAction(raw: InviteMemberInput): Promise<ActionResult> {
  const parsed = inviteMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  const { teamId, email, role } = parsed.data
  const result = await callApi(
    endpoints.teams.members(teamId),
    { method: "POST", body: { email, role } },
    "Erro ao adicionar o membro.",
  )
  if (result.success) {
    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/team")
  }
  return result.success ? { success: true, data: undefined } : result
}

export async function updateTeamMemberRoleAction(
  raw: UpdateMemberRoleInput,
): Promise<ActionResult> {
  const parsed = updateMemberRoleSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  const { teamId, userId, role } = parsed.data
  // Endpoint proposto: PUT /teams/{id}/members/{userId} (docs/backend-backlog.md).
  const result = await callApi(
    endpoints.teams.member(teamId, userId),
    { method: "PUT", body: { role } },
    "Erro ao alterar o papel do membro.",
  )
  if (result.success) revalidatePath(`/dashboard/team`)
  return result.success ? { success: true, data: undefined } : result
}

export async function removeTeamMemberAction(
  teamId: string,
  targetUserId: string,
): Promise<ActionResult> {
  const result = await callApi(
    endpoints.teams.member(teamId, targetUserId),
    { method: "DELETE" },
    "Erro ao remover o membro.",
  )
  if (result.success) {
    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/team")
  }
  return result.success ? { success: true, data: undefined } : result
}
