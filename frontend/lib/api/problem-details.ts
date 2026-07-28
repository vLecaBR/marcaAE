/**
 * Tratamento padronizado de erros ProblemDetails (RFC 7807) retornados pela API .NET.
 * Ver spec §3.1 (contrato) e §3.4 (mapa de estados de erro para UX).
 */

/** Payload ProblemDetails conforme RFC 7807, com extensões comuns do ASP.NET Core. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  /** Erros de validação por campo (ValidationProblemDetails do ASP.NET). */
  errors?: Record<string, string[]>
  /** Código de domínio opcional emitido pelo backend (ex.: "SLOT_CONFLICT"). */
  code?: string
  /** Extensões arbitrárias. */
  [key: string]: unknown
}

/**
 * Categorias estáveis de erro para a UI reagir sem depender de status HTTP cru.
 * Mapeamento de status → categoria segue a spec §3.4.
 */
export type ApiErrorKind =
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "conflict" // 409 — horário / já paga / conta inativa
  | "validation" // 422 — duração / disponibilidade / sem preço
  | "payment_provider" // 502 — falha no provedor de pagamento
  | "network" // falha de transporte (sem resposta)
  | "server" // 5xx genérico
  | "unknown"

function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 401:
      return "unauthorized"
    case 403:
      return "forbidden"
    case 404:
      return "not_found"
    case 409:
      return "conflict"
    case 422:
      return "validation"
    case 502:
      return "payment_provider"
    default:
      if (status >= 500) return "server"
      return "unknown"
  }
}

/**
 * Erro tipado que encapsula uma resposta de falha da API.
 * A camada de UI decide a copy a partir de `kind`/`code`; o `problem` traz o detalhe original.
 */
export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly problem: ProblemDetails
  /** Código de domínio, quando presente (`problem.code`). */
  readonly code?: string

  constructor(status: number, problem: ProblemDetails, kind?: ApiErrorKind) {
    super(problem.detail || problem.title || `Erro na API (${status})`)
    this.name = "ApiError"
    this.status = status
    this.kind = kind ?? kindFromStatus(status)
    this.problem = problem
    this.code = typeof problem.code === "string" ? problem.code : undefined
  }

  /** Erros de validação achatados por campo (para `react-hook-form` etc.). */
  get fieldErrors(): Record<string, string[]> {
    return this.problem.errors ?? {}
  }

  static network(cause?: unknown): ApiError {
    const err = new ApiError(0, { title: "Falha de conexão com o servidor." }, "network")
    if (cause) err.cause = cause
    return err
  }
}

/** Type guard para uso em `catch (e) { if (isApiError(e)) ... }`. */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/**
 * Constrói um `ApiError` a partir de uma `Response` de falha, tentando ler o corpo
 * como ProblemDetails (JSON). Faz fallback gracioso se o corpo não for JSON válido.
 */
export async function apiErrorFromResponse(res: Response): Promise<ApiError> {
  let problem: ProblemDetails = { status: res.status, title: res.statusText }
  try {
    const text = await res.text()
    if (text) {
      const parsed = JSON.parse(text) as ProblemDetails
      problem = { status: res.status, ...parsed }
    }
  } catch {
    // Corpo não-JSON: mantém o fallback com statusText.
  }
  return new ApiError(res.status, problem)
}
