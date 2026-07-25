/**
 * BFF catch-all — encaminha `/api/bff/<...>` para a API .NET (`/api/v1/<...>`).
 *
 * Padrão único de escrita/leitura client-driven (ADR-0001). Todo componente cliente que precise
 * chamar a API passa por aqui: o cookie `HttpOnly` e o CSRF são injetados server-side, o ciclo
 * de refresh é transparente e os ProblemDetails são repassados sem tradução.
 *
 * Segurança: só encaminha rotas na allowlist (`BFF_ALLOWLIST`) para não virar open proxy.
 */

import { NextRequest, NextResponse } from "next/server"
import { proxyToApi } from "@/lib/api/bff"
import { BFF_ALLOWLIST } from "@/lib/api/config"

// A sessão depende de cookies por requisição — nunca cachear.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = { params: Promise<{ path: string[] }> }

function isAllowed(segments: string[]): boolean {
  const head = segments[0]
  return !!head && BFF_ALLOWLIST.includes(head)
}

async function handle(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { path } = await ctx.params
  if (!isAllowed(path)) {
    return NextResponse.json(
      { title: "Rota não permitida pelo BFF.", status: 404 },
      { status: 404 },
    )
  }
  const targetPath = `/${path.map(encodeURIComponent).join("/")}`
  return proxyToApi(req, targetPath)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
