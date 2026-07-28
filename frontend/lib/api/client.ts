/**
 * Cliente HTTP do lado do browser. Contrapartida client-side do `http-client.ts` (server-only).
 *
 * Componentes cliente NUNCA chamam a API .NET diretamente — sempre o BFF same-origin
 * (`/api/bff/...`), que injeta cookie de sessão + CSRF e trata refresh (ADR-0001). Aqui só
 * disparamos a chamada same-origin e normalizamos ProblemDetails em `ApiError`.
 *
 * Ausência de `server-only` é intencional: este módulo roda no cliente.
 */

import { BFF_PREFIX } from "@/lib/api/config"
import { ApiError, type ProblemDetails } from "@/lib/api/problem-details"

export interface ClientFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
}

function buildPath(path: string, query?: ClientFetchInit["query"]): string {
  // `path` é relativo à API (`/bookings/...`); prefixamos com o BFF.
  const clean = path.startsWith("/") ? path : `/${path}`
  const url = `${BFF_PREFIX}${clean}`
  if (!query) return url
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.append(k, String(v))
  }
  const suffix = qs.toString()
  return suffix ? `${url}?${suffix}` : url
}

/**
 * Chama o BFF a partir do cliente. Serializa JSON, envia cookies (same-origin) e converte
 * respostas de erro em `ApiError` (ProblemDetails).
 *
 * @throws {ApiError}
 */
export async function apiClient<T = unknown>(
  path: string,
  init: ClientFetchInit = {},
): Promise<T> {
  const { body, query, headers, ...rest } = init
  const finalHeaders = new Headers(headers)
  finalHeaders.set("Accept", "application/json")

  let finalBody: BodyInit | undefined
  const isPlainObject =
    body !== undefined &&
    body !== null &&
    typeof body !== "string" &&
    !(body instanceof FormData)
  if (isPlainObject) {
    finalHeaders.set("Content-Type", "application/json")
    finalBody = JSON.stringify(body)
  } else if (body !== undefined && body !== null) {
    finalBody = body as BodyInit
  }

  let res: Response
  try {
    res = await fetch(buildPath(path, query), {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      credentials: "same-origin",
    })
  } catch (cause) {
    throw ApiError.network(cause)
  }

  if (!res.ok) {
    let problem: ProblemDetails = { status: res.status, title: res.statusText }
    try {
      const parsed = (await res.json()) as ProblemDetails
      problem = { status: res.status, ...parsed }
    } catch {
      /* corpo não-JSON: mantém fallback */
    }
    throw new ApiError(res.status, problem)
  }

  if (res.status === 204) return null as T
  const text = await res.text()
  return (text.length ? JSON.parse(text) : null) as T
}
