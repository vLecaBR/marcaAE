"use server"

/**
 * Ações de agendamento do profissional — proxy para a API .NET (Fase 5). Sem Prisma/NextAuth/Google.
 *
 * Gap de backend: a API expõe `POST /bookings/{uid}/cancel`, mas **não** há endpoint de
 * aprovação/confirmação manual de um booking PENDING (o antigo fluxo criava o evento no Google
 * e marcava CONFIRMED). Enquanto o endpoint não existir, `approveBookingAction` retorna aviso.
 * Registrado em docs/backend-backlog.md.
 */

import { revalidatePath } from "next/cache"
import { endpoints } from "@/lib/api/endpoints"
import { callApi, type ActionResult } from "@/lib/api/action-helpers"

export async function approveBookingAction(_uid: string): Promise<ActionResult> {
  return {
    success: false,
    error: "A aprovação manual estará disponível em breve (endpoint de backend pendente).",
  }
}

export async function rejectBookingAction(uid: string, reason: string): Promise<ActionResult> {
  const result = await callApi(
    endpoints.bookings.cancel(uid),
    { method: "POST", body: { reason, canceledBy: "OWNER" } },
    "Erro ao cancelar o agendamento.",
  )
  if (result.success) {
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/bookings")
  }
  return result.success ? { success: true, data: undefined } : result
}
