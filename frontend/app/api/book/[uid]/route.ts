/**
 * Status do agendamento (público) — proxy para `GET {API}/bookings/{uid}`.
 * Usado pelo polling `usePaymentStatus` para detectar a confirmação assíncrona do pagamento
 * (que chega por webhook no backend). Ver ADR-0002.
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { BookingDetailDto } from "@/lib/api/booking-types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
  const { uid } = await params
  try {
    const result = await rawApiFetch<BookingDetailDto>(endpoints.bookings.byUid(uid))
    const b = result.data
    return NextResponse.json({
      uid: b.uid,
      status: b.status,
      paymentStatus: b.paymentStatus ?? "PENDING",
    })
  } catch (err) {
    if (isApiError(err)) {
      return NextResponse.json({ error: err.problem.detail ?? "Não encontrado." }, { status: err.status || 404 })
    }
    throw err
  }
}
