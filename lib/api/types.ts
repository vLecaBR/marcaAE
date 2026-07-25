/**
 * Tipos de DTO da API .NET consumidos pelo front.
 *
 * Estes espelham os contratos de `docs/backend-api.md`. Mantidos manualmente na Fase 0;
 * podem ser gerados a partir do OpenAPI da API numa fase posterior. Enums são serializados
 * como string pelo backend.
 */

/** Usuário autenticado — retorno de `GET /auth/me` e dos fluxos de login (spec §3.2). */
export interface MeDto {
  id: string
  email: string
  username: string | null
  onboarded: boolean
  timeZone: string
}

/** Provedores de pagamento aceitos por `POST /bookings/{uid}/pay` (spec §3.3). */
export type PaymentProvider = "MERCADO_PAGO" | "STRIPE"

/** Estados de pagamento do snapshot do Booking (spec §6.4). */
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED"

/** Status da sub-conta de recebimento (PayoutAccount) — spec §6.1. */
export type PayoutAccountStatus = "PENDING" | "ACTIVE" | "RESTRICTED"

/**
 * Envelope de sucesso genérico do cliente HTTP. A camada de UI/BFF trabalha sobre `data`;
 * falhas são lançadas como `ApiError` (ver problem-details.ts), não retornadas aqui.
 */
export interface ApiResult<T> {
  data: T
  status: number
  /** Cookies `Set-Cookie` recebidos da API (ex.: rotação de token no refresh). */
  setCookies: string[]
}
