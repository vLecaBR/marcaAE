/**
 * Landing pós-OAuth Google. A API .NET conclui em `/auth/google/complete`, emite os cookies de
 * sessão (no host compartilhado) e redireciona o browser para `FRONT/auth/callback`.
 * Como os cookies já chegaram, aqui só consultamos a sessão e roteamos.
 *
 * Contrato de backend: `google/complete` deve redirecionar para este caminho após emitir a sessão
 * (ver docs/backend-backlog.md → "Contrato de redirect do front").
 */

import { NextRequest, NextResponse } from "next/server"
import { getMe } from "@/lib/api/session"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const me = await getMe()
  if (!me) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.nextUrl))
  }
  const dest = me.onboarded ? "/dashboard" : "/onboarding"
  return NextResponse.redirect(new URL(dest, req.nextUrl))
}
