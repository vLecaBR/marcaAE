import "server-only"

/**
 * Sessão do usuário via API .NET. O token vive em cookie `HttpOnly`; aqui apenas
 * consultamos/rotacionamos a sessão pelo backend — nunca lemos o token no cliente (spec §8).
 */

import { rawApiFetch, serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { MeDto } from "@/lib/api/types"

/**
 * Retorna o usuário autenticado, ou `null` se não houver sessão válida.
 * Uso típico em RSC/layout para guardas de rota (não faz refresh — ver bff.ts).
 */
export async function getMe(): Promise<MeDto | null> {
  try {
    return await serverApiFetch<MeDto>(endpoints.auth.me)
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") return null
    throw err
  }
}

/** Resultado de uma tentativa de refresh, com os cookies rotacionados a repassar ao browser. */
export interface RefreshResult {
  me: MeDto
  /** `Set-Cookie` emitidos pela API (novo par de tokens) — o BFF os reenvia ao browser. */
  setCookies: string[]
}

/**
 * Rotaciona o par de tokens a partir do refresh cookie presente em `cookieHeader`.
 * Só deve ser chamado de um contexto que consiga reescrever cookies (Route Handler / BFF),
 * pois a API responde com novos `Set-Cookie` que precisam chegar ao browser.
 *
 * @returns o novo `MeDto` + cookies rotacionados, ou `null` se o refresh falhou (401).
 */
export async function refreshSession(cookieHeader: string): Promise<RefreshResult | null> {
  try {
    const result = await rawApiFetch<MeDto>(
      endpoints.auth.refresh,
      { method: "POST" },
      { cookieHeader },
    )
    return { me: result.data, setCookies: result.setCookies }
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") return null
    throw err
  }
}
