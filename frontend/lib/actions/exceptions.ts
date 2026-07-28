"use server"

/**
 * Exceções de agenda (bloqueios/férias) — proxy fino para a API .NET (Fase 5).
 * `POST /schedules/{id}/exceptions` e `DELETE /exceptions/{id}`. Sem Prisma/NextAuth.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { endpoints } from "@/lib/api/endpoints"
import { callApi, type ActionResult } from "@/lib/api/action-helpers"

const exceptionSchema = z.object({
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  type: z.enum(["BLOCKED", "VACATION", "OVERRIDE"]).default("BLOCKED"),
  reason: z.string().max(100, "Motivo muito longo").optional(),
})

export async function addExceptionAction(
  raw: z.infer<typeof exceptionSchema>,
): Promise<ActionResult> {
  const parsed = exceptionSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: "Dados inválidos." }

  const { scheduleId, date, type, reason } = parsed.data
  const result = await callApi(
    endpoints.schedules.exceptions(scheduleId),
    { method: "POST", body: { date, type, startTime: null, endTime: null, reason: reason ?? null } },
    "Erro ao adicionar o bloqueio.",
  )
  if (result.success) revalidatePath("/settings/availability")
  return result.success ? { success: true, data: undefined } : result
}

export async function removeExceptionAction(id: string): Promise<ActionResult> {
  const result = await callApi(
    endpoints.schedules.exception(id),
    { method: "DELETE" },
    "Erro ao remover o bloqueio.",
  )
  if (result.success) revalidatePath("/settings/availability")
  return result.success ? { success: true, data: undefined } : result
}
