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
import { isValidPaidPlan, PLAN_INTENT_COOKIE } from "@/lib/billing/plan-intent"
import type { MeDto } from "@/lib/api/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.nextUrl))
  }

  // Bug 1: o backend ecoa a intenção de plano recuperada do state do OAuth. Só aceitamos um plano
  // pago válido (o `CheckoutIntentRunner` também revalida contra o catálogo).
  const planParam = req.nextUrl.searchParams.get("plan")
  const plan = isValidPaidPlan(planParam) ? planParam : null

  try {
    const result = await rawApiFetch<MeDto>(endpoints.auth.googleExchange, {
      method: "GET",
      query: { code },
    })

    // Repassa o plano ao destino: cobre onboarding→dashboard e serve de fallback ao cookie.
    const dest = new URL(result.data.onboarded ? "/dashboard" : "/onboarding", req.nextUrl)
    if (plan) dest.searchParams.set("plan", plan)

    const res = NextResponse.redirect(dest)
    for (const c of result.setCookies) res.headers.append("set-cookie", c)

    // Carrier durável (bug 1): cookie same-site no domínio do front, legível pelo runner no client.
    if (plan) {
      res.cookies.set(PLAN_INTENT_COOKIE, plan, {
        path: "/",
        maxAge: 30 * 60,
        sameSite: "lax",
        httpOnly: false, // o CheckoutIntentRunner (client) precisa ler
        secure: req.nextUrl.protocol === "https:",
      })
    }
    return res
  } catch (err) {
    if (isApiError(err)) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.nextUrl))
    }
    throw err
  }
}
