import { NextResponse } from "next/server"
import { createBooking } from "@/lib/actions/booking"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createBooking(body)

    if (result.status === "success") {
      return NextResponse.json(result)
    }

    // Mapping specific errors to HTTP status codes
    let status = 400
    if (result.status === "not_found") status = 404
    if (result.status === "conflict") status = 409
    if (result.status === "internal") status = 500

    return NextResponse.json(result, { status })
  } catch (err) {
    console.error("[POST /api/book]", err)
    return NextResponse.json(
      { status: "internal", message: "Erro interno no servidor." },
      { status: 500 }
    )
  }
}
