/**
 * DTOs de Recebimentos (PayoutAccount) — Fase 4.
 *
 * Espelham o contrato esperado de `docs/backend-api.md` (§3.4 · payouts). Enquanto o
 * `FinanceController`/`PayoutsController` não estão finalizados no backend, os campos de
 * **saldo/saques** (`PayoutBalanceDto`, `PayoutTransactionDto`) são consumidos de mock no
 * front (ver `lib/mocks/payouts.ts`) — a assinatura já é a definitiva para trocar por dados
 * reais sem tocar na UI.
 */

import type { PayoutAccountStatus, PaymentProvider } from "@/lib/api/types"

export type { PayoutAccountStatus, PaymentProvider }

/**
 * Conta de recebimento do profissional — retorno de `GET /payouts` (item) e base do card de
 * status. `onboardingUrl` só vem quando `status !== "ACTIVE"` (link do provedor p/ concluir).
 */
export interface PayoutAccountDto {
  id: string
  provider: PaymentProvider
  status: PayoutAccountStatus
  /** Link do provedor (Stripe Connect Express / Mercado Pago) para concluir o cadastro. */
  onboardingUrl?: string | null
  /** Últimos dígitos/label da conta bancária quando ativa (ex.: "•••• 4321"). */
  bankLabel?: string | null
  /** ISO — quando a conta foi ativada. */
  activatedAt?: string | null
}

/** Retorno de `POST /payouts/onboarding` — link para redirecionar ao provedor. */
export interface PayoutOnboardingResponse {
  onboardingUrl: string
}

/**
 * Saldo consolidado da conta de recebimento (valores em centavos, BRL).
 * Origem: `GET /payouts/{provider}/status` (a confirmar no backend) — hoje mockado no front.
 */
export interface PayoutBalanceDto {
  currency: "BRL"
  /** Disponível para saque agora. */
  availableCents: number
  /** Em processamento / a liberar (janela de compensação do provedor). */
  pendingCents: number
  /** Total já sacado para a conta bancária. */
  paidOutCents: number
  /** ISO — data do próximo repasse automático, se houver. */
  nextPayoutDate?: string | null
}

export type PayoutTransactionKind = "PAYMENT" | "PAYOUT" | "REFUND" | "FEE"
export type PayoutTransactionStatus = "PAID" | "PENDING" | "IN_TRANSIT" | "FAILED"

/** Linha do extrato de saques/repasses — mockada até o backend expor o endpoint. */
export interface PayoutTransactionDto {
  id: string
  /** ISO. */
  date: string
  kind: PayoutTransactionKind
  description: string
  /** Positivo = entrada; negativo = saque/estorno. Centavos. */
  amountCents: number
  status: PayoutTransactionStatus
}
