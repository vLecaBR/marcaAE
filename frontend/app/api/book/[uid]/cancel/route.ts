/**
 * Cancelamento de agendamento (público) — proxy para `POST {API}/bookings/{uid}/cancel`.
 * Substitui `cancelBooking` (Prisma).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const cancelSchema = z.object({
  reason: z.string().min(1).max(500).default("Cancelado pelo solicitante."),
  canceledBy: z.enum(["OWNER", "GUEST"]).default("GUEST"),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
  const { uid } = await params

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    /* corpo vazio → defaults */
  }

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  try {
    await rawApiFetch(endpoints.bookings.cancel(uid), { method: "POST", body: parsed.data })
    return NextResponse.json({ message: "Agendamento cancelado." })
  } catch (err) {
    if (isApiError(err)) {
      return NextResponse.json(
        { error: err.problem.detail ?? "Erro ao cancelar." },
        { status: err.status || 500 },
      )
    }
    throw err
  }
}
