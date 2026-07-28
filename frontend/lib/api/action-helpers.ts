import "server-only"

/**
 * Ponte entre Server Actions e a API .NET (transição da Fase 5).
 *
 * Nota de arquitetura: o ADR-0001 elege Route Handlers (BFF) como padrão de mutation. Estas
 * Server Actions são **proxies finos e transitórios** que chamam `serverApiFetch` — mantêm as
 * assinaturas legadas (`{ success, error }`) para os componentes client não precisarem mudar,
 * enquanto removem Prisma/NextAuth. Migrá-las para o BFF é um follow-up (ver docs).
 */

import { serverApiFetch, type ApiFetchInit } from "@/lib/api/http-client"
import { isApiError } from "@/lib/api/problem-details"

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/** Mensagens de UX por categoria de erro (spec §3.4). */
function messageFor(err: unknown, fallback: string): string {
  if (!isApiError(err)) return fallback
  switch (err.kind) {
    case "unauthorized":
      return "Sua sessão expirou. Entre novamente."
    case "forbidden":
      return "Você não tem permissão para esta ação."
    case "not_found":
      return "Registro não encontrado."
    case "conflict":
      return err.problem.detail || "Conflito: este registro já existe ou está em uso."
    case "validation":
      return err.problem.detail || "Dados inválidos. Revise os campos."
    default:
      return err.problem.detail || fallback
  }
}

/**
 * Executa uma chamada à API e normaliza para `ActionResult`.
 * Uso: `return apiAction(() => serverApiFetch(...), "Erro ao salvar")`.
 */
export async function apiAction<T>(
  fn: () => Promise<T>,
  fallback = "Não foi possível concluir a ação.",
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (err) {
    if (!isApiError(err)) throw err
    return { success: false, error: messageFor(err, fallback) }
  }
}

/** Açúcar: chama `serverApiFetch` e devolve `ActionResult`. */
export function callApi<T = unknown>(
  path: string,
  init: ApiFetchInit,
  fallback?: string,
): Promise<ActionResult<T>> {
  return apiAction<T>(() => serverApiFetch<T>(path, init), fallback)
}
