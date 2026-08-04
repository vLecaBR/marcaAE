import "server-only"

/**
 * BFF (Backend-for-Frontend) — cola entre os Route Handlers do Next e a API .NET.
 * Ver ADR-0001. Responsabilidades:
 *  - repassar a requisição do browser para a API com o cookie de sessão e o header CSRF;
 *  - implementar o ciclo `401 → POST /auth/refresh → retry` (uma vez), que só é possível aqui
 *    porque um Route Handler pode reescrever `Set-Cookie` de volta ao browser;
 *  - propagar os `Set-Cookie` da API (rotação de token) ao browser;
 *  - devolver ProblemDetails como JSON preservando o status original.
 */

import { NextRequest, NextResponse } from "next/server"
import { rawApiFetch } from "@/lib/api/http-client"
import { refreshSession } from "@/lib/api/session"
import { COOKIE } from "@/lib/api/config"
import { apiErrorFromResponse, ApiError, isApiError } from "@/lib/api/problem-details"

const BODYLESS_METHODS = new Set(["GET", "HEAD"])

/** Lê o valor de um cookie a partir de um header `Cookie`. */
function readCookie(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=")
    if (idx === -1) continue
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim())
    }
  }
  return undefined
}

/**
 * Aplica strings `Set-Cookie` sobre um header `Cookie`, sobrescrevendo valores por nome.
 * Usado para montar o cookie da 2ª tentativa após um refresh bem-sucedido.
 */
function applySetCookies(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>()
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=")
    if (idx === -1) continue
    jar.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim())
  }
  for (const sc of setCookies) {
    const first = sc.split(";")[0]
    const idx = first.indexOf("=")
    if (idx === -1) continue
    jar.set(first.slice(0, idx).trim(), first.slice(idx + 1).trim())
  }
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ")
}

/** Anexa múltiplos `Set-Cookie` a uma resposta (append, nunca sobrescreve). */
function attachSetCookies(res: NextResponse, setCookies: string[]): void {
  for (const c of setCookies) res.headers.append("set-cookie", c)
}

/** Converte um `ApiResult`/erro numa `NextResponse` com os cookies certos. */
function jsonWithCookies(data: unknown, status: number, setCookies: string[]): NextResponse {
  // 204/205/304 não podem ter corpo — `Response.json()` lança "Invalid response status code".
  // O backend responde 204 em mutations sem retorno (ex.: PUT /me/profile), então tratamos aqui.
  const bodyless = status === 204 || status === 205 || status === 304
  const res = bodyless
    ? new NextResponse(null, { status })
    : NextResponse.json(data ?? null, { status })
  attachSetCookies(res, setCookies)
  return res
}

/**
 * Encaminha `req` para `targetPath` na API .NET. `targetPath` é relativo a `/api/v1`
 * (ex.: `/bookings/abc/pay`); a query string da requisição original é anexada.
 */
export async function proxyToApi(req: NextRequest, targetPath: string): Promise<NextResponse> {
  const method = req.method.toUpperCase()
  const cookieHeader = req.headers.get("cookie") ?? ""
  const csrfToken = readCookie(cookieHeader, COOKIE.csrf)
  const search = req.nextUrl.search // preserva ?from=...&to=...
  const path = `${targetPath}${search}`

  // Corpo repassado cru; preserva o Content-Type original.
  let body: ArrayBuffer | undefined
  const forwardHeaders = new Headers()
  if (!BODYLESS_METHODS.has(method)) {
    body = await req.arrayBuffer()
    const ct = req.headers.get("content-type")
    if (ct) forwardHeaders.set("content-type", ct)
  }

  const doFetch = (cookie: string) =>
    rawApiFetch<unknown>(
      path,
      { method, headers: forwardHeaders, body },
      { cookieHeader: cookie, csrfToken },
    )

  try {
    const result = await doFetch(cookieHeader)
    return jsonWithCookies(result.data, result.status, result.setCookies)
  } catch (err) {
    if (!isApiError(err)) throw err

    // 401 → tenta refresh + retry uma única vez.
    if (err.kind === "unauthorized") {
      const refreshed = await refreshSession(cookieHeader)
      if (!refreshed) {
        return jsonWithCookies(err.problem, 401, [])
      }
      const retryCookie = applySetCookies(cookieHeader, refreshed.setCookies)
      try {
        const result = await doFetch(retryCookie)
        // Cookies do refresh + os do retry precisam chegar ao browser.
        return jsonWithCookies(result.data, result.status, [
          ...refreshed.setCookies,
          ...result.setCookies,
        ])
      } catch (retryErr) {
        if (isApiError(retryErr)) {
          return jsonWithCookies(retryErr.problem, retryErr.status || 500, refreshed.setCookies)
        }
        throw retryErr
      }
    }

    // Demais erros: repassa ProblemDetails com o status original.
    return jsonWithCookies(err.problem, err.status || 500, [])
  }
}

/** Helper para construir uma resposta de erro ProblemDetails a partir de uma `Response` crua. */
export async function problemFromResponse(res: Response): Promise<NextResponse> {
  const apiErr: ApiError = await apiErrorFromResponse(res)
  return NextResponse.json(apiErr.problem, { status: apiErr.status })
}
