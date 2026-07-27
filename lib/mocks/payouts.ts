/**
 * Mocks de Recebimentos — Fase 4 (temporário).
 *
 * O `PayoutsController`/`FinanceController` do backend ainda não estão finalizados. Enquanto
 * isso, o saldo e o extrato de saques usam estes dados para permitir construir e revisar a UI.
 * A assinatura é a definitiva (`lib/api/payout-types.ts`): para ir a produção, basta trocar a
 * fonte por `serverApiFetch`/`apiClient` sem alterar os componentes.
 *
 * ⚠️ REMOVER ao plugar o backend real (grep por `MOCK_` / `docs/backend-backlog.md §4.2`).
 */

import type {
  PayoutAccountDto,
  PayoutBalanceDto,
  PayoutTransactionDto,
} from "@/lib/api/payout-types"

/**
 * Conta de demonstração ATIVA — permite ver o fluxo completo (badge + saldo + saques) sem
 * backend. Para exercitar a jornada de onboarding do Stripe Connect Express, troque `status`
 * para `"PENDING"` (o card mostra o CTA "Concluir cadastro") ou `"RESTRICTED"`.
 */
export const MOCK_PAYOUT_ACCOUNT: PayoutAccountDto = {
  id: "mock-acct-1",
  provider: "STRIPE",
  status: "ACTIVE",
  onboardingUrl: null,
  bankLabel: "Itaú •••• 4321",
  activatedAt: "2026-06-01T00:00:00Z",
}

export const MOCK_PAYOUT_BALANCE: PayoutBalanceDto = {
  currency: "BRL",
  availableCents: 128_40_0, // R$ 1.284,00
  pendingCents: 42_90_0, //   R$ 429,00
  paidOutCents: 863_50_0, //  R$ 8.635,00
  nextPayoutDate: "2026-07-31T00:00:00Z",
}

export const MOCK_PAYOUT_TRANSACTIONS: PayoutTransactionDto[] = [
  {
    id: "tx-1",
    date: "2026-07-26T14:10:00Z",
    kind: "PAYMENT",
    description: "Consulta — Ana Beatriz",
    amountCents: 18_00_0,
    status: "PAID",
  },
  {
    id: "tx-2",
    date: "2026-07-25T09:30:00Z",
    kind: "PAYMENT",
    description: "Consulta — Carlos Menezes",
    amountCents: 25_00_0,
    status: "PAID",
  },
  {
    id: "tx-3",
    date: "2026-07-24T18:00:00Z",
    kind: "PAYOUT",
    description: "Repasse automático — Itaú •••• 4321",
    amountCents: -40_00_0,
    status: "IN_TRANSIT",
  },
  {
    id: "tx-4",
    date: "2026-07-23T11:45:00Z",
    kind: "REFUND",
    description: "Estorno — Marina Alves",
    amountCents: -12_00_0,
    status: "PAID",
  },
  {
    id: "tx-5",
    date: "2026-07-22T16:20:00Z",
    kind: "PAYMENT",
    description: "Consulta — João Pedro",
    amountCents: 22_00_0,
    status: "PENDING",
  },
]
