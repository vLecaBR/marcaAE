/**
 * Logout — encerra a sessão na API .NET e limpa os cookies no browser.
 * Substitui o `signOut()` do NextAuth (ADR-0001).
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { COOKIE } from "@/lib/api/config"
import { isApiError } from "@/lib/api/problem-details"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const csrfToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE.csrf}=`))
    ?.split("=")[1]

  const setCookies: string[] = []
  try {
    const result = await rawApiFetch(
      endpoints.auth.logout,
      { method: "POST" },
      { cookieHeader, csrfToken: csrfToken && decodeURIComponent(csrfToken) },
    )
    setCookies.push(...result.setCookies)
  } catch (err) {
    // Logout é idempotente: mesmo se a API falhar/expirar, limpamos os cookies locais.
    if (!isApiError(err)) throw err
  }

  const res = NextResponse.json({ ok: true }, { status: 200 })
  for (const c of setCookies) res.headers.append("set-cookie", c)
  // Garante limpeza local caso a API não tenha enviado Set-Cookie de expiração.
  res.cookies.set(COOKIE.accessToken, "", { path: "/", maxAge: 0 })
  res.cookies.set(COOKIE.csrf, "", { path: "/", maxAge: 0 })
  return res
}
