/**
 * Landing do magic link. O e-mail aponta para `FRONT/auth/verify?token=...`.
 * Aqui trocamos o token pela sessão na API .NET (`GET /auth/magic-link/verify`), repassamos os
 * cookies emitidos ao browser e redirecionamos conforme o estado de onboarding.
 *
 * Mantém o fluxo sob controle do front (não dependemos de o backend redirecionar).
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { MeDto } from "@/lib/api/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.nextUrl))
  }

  try {
    const result = await rawApiFetch<MeDto>(endpoints.auth.magicLinkVerify, {
      method: "GET",
      query: { token },
    })
    const dest = result.data.onboarded ? "/dashboard" : "/onboarding"
    const res = NextResponse.redirect(new URL(dest, req.nextUrl))
    for (const c of result.setCookies) res.headers.append("set-cookie", c)
    return res
  } catch (err) {
    if (isApiError(err)) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.nextUrl))
    }
    throw err
  }
}
