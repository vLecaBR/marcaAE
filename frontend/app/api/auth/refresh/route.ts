/**
 * Endpoint de refresh chamado pelo cliente quando detecta sessão expirada.
 * Rotaciona o par de tokens via API .NET e repassa os novos `Set-Cookie` ao browser.
 *
 * Também é o gancho para forçar refresh após atualizar o perfil (username/onboarded mudam),
 * conforme observação da API em `docs/backend-api.md`.
 */

import { NextRequest, NextResponse } from "next/server"
import { refreshSession } from "@/lib/api/session"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const refreshed = await refreshSession(cookieHeader)

  if (!refreshed) {
    return NextResponse.json(
      { title: "Sessão expirada. Faça login novamente.", status: 401 },
      { status: 401 },
    )
  }

  const res = NextResponse.json(refreshed.me, { status: 200 })
  for (const c of refreshed.setCookies) res.headers.append("set-cookie", c)
  return res
}
