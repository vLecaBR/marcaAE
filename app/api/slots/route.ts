/**
 * Slots públicos — proxy para `GET {API}/slots`. Prisma/scheduling removidos: o cálculo de
 * disponibilidade (janelas, exceções, buffers, FreeBusy do Google) é 100% do backend .NET.
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { Slot } from "@/lib/api/booking-types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const ownerId = sp.get("ownerId")
  const eventTypeId = sp.get("eventTypeId")
  const date = sp.get("date")
  const tz = sp.get("tz") ?? "UTC"

  if (!ownerId || !eventTypeId || !date) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
  }

  try {
    const result = await rawApiFetch<{ slots: Slot[] }>(endpoints.slots, {
      method: "GET",
      query: { ownerId, eventTypeId, date, tz },
    })
    return NextResponse.json({ slots: result.data?.slots ?? [] })
  } catch (err) {
    if (isApiError(err)) {
      if (err.kind === "not_found") return NextResponse.json({ slots: [] })
      return NextResponse.json(
        { error: err.problem.detail ?? "Erro ao buscar horários." },
        { status: err.status || 500 },
      )
    }
    throw err
  }
}
