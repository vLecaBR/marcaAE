/**
 * Landing pós-OAuth Google. A API .NET conclui em `/auth/google/complete`, provisiona o usuário e
 * redireciona para `FRONT/auth/callback?code=...` com um código de troca de uso único.
 *
 * Como API e frontend vivem em domínios diferentes, a sessão NÃO pode ser emitida pela API (o cookie
 * ficaria preso no domínio dela). Aqui trocamos o código pela sessão (`GET /auth/google/exchange`),
 * re-emitimos os cookies no domínio do front e roteamos — mesmo padrão do magic link (`/auth/verify`).
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { MeDto } from "@/lib/api/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.nextUrl))
  }

  try {
    const result = await rawApiFetch<MeDto>(endpoints.auth.googleExchange, {
      method: "GET",
      query: { code },
    })
    const dest = result.data.onboarded ? "/dashboard" : "/onboarding"
    const res = NextResponse.redirect(new URL(dest, req.nextUrl))
    for (const c of result.setCookies) res.headers.append("set-cookie", c)
    return res
  } catch (err) {
    if (isApiError(err)) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.nextUrl))
    }
    throw err
  }
}
