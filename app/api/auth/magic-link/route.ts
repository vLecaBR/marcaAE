/**
 * Solicita um magic link. Proxy fino para `POST /auth/magic-link/request` na API .NET.
 * Não exige sessão (login), por isso fica fora do BFF catch-all (allowlist).
 * A API sempre responde 200 (não revela se o e-mail existe) — apenas repassamos.
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest): Promise<NextResponse> {
  let email = ""
  try {
    const body = (await req.json()) as { email?: string }
    email = (body.email ?? "").trim()
  } catch {
    /* corpo inválido → cai na validação abaixo */
  }

  if (!email) {
    return NextResponse.json({ title: "E-mail obrigatório.", status: 422 }, { status: 422 })
  }

  try {
    const result = await rawApiFetch<{ message?: string }>(endpoints.auth.magicLinkRequest, {
      method: "POST",
      body: { email },
    })
    return NextResponse.json(result.data ?? { ok: true }, { status: 200 })
  } catch (err) {
    if (isApiError(err)) {
      // Não vazar detalhe; resposta genérica de sucesso mantém a não-revelação de existência.
      return NextResponse.json({ ok: true }, { status: 200 })
    }
    throw err
  }
}
