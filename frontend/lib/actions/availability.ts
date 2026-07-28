"use server"

/**
 * Disponibilidade — proxy fino para `PUT /schedules/{id}/availability` (Fase 5).
 * Sem Prisma/NextAuth. Achata os intervalos por dia no formato da API.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { availabilitySchema } from "@/lib/validators/onboarding"
import { endpoints } from "@/lib/api/endpoints"
import { callApi, type ActionResult } from "@/lib/api/action-helpers"

export async function saveAvailabilityAction(
  raw: z.infer<typeof availabilitySchema>,
): Promise<ActionResult> {
  const parsed = availabilitySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { scheduleId, timeZone, availabilities } = parsed.data

  // Achata dias habilitados em janelas { dayOfWeek, startTime, endTime } (contrato da API).
  const flat = availabilities
    .filter((d) => d.enabled && d.intervals.length > 0)
    .flatMap((d) =>
      d.intervals.map((i) => ({ dayOfWeek: d.dayOfWeek, startTime: i.startTime, endTime: i.endTime })),
    )

  const result = await callApi(
    endpoints.schedules.availability(scheduleId),
    { method: "PUT", body: { timeZone, availabilities: flat } },
    "Erro ao salvar a disponibilidade.",
  )
  if (result.success) revalidatePath("/settings/availability")
  return result.success ? { success: true, data: undefined } : result
}
