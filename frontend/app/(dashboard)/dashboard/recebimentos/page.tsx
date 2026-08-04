/**
 * Recebimentos (Fase 4 · spec §5). Rota: `/dashboard/recebimentos`. Guarda: `requireOnboarded()`.
 *
 * Leitura em RSC (ADR-0001): `GET /payouts` direto na API — dado real da conta de recebimento
 * (Q4). Sem conta ainda → `null` (card mostra o CTA "Ativar recebimentos"). O onboarding real
 * (Stripe Connect Express + Account Link) e o webhook `account.updated` (KYC → ACTIVE) já estão no
 * backend. Mutations (onboarding/unlink) vão pela Server Action-proxy `lib/actions/payouts.ts`.
 *
 * Saldo/extrato (`PayoutBalanceCard`) ainda usam mock — dependem do painel financeiro (Q5).
 */

import { redirect } from "next/navigation"
import Link from "next/link"
import { BarChart3, ArrowRight } from "lucide-react"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import { PayoutStatusCard } from "@/components/payouts/payout-status-card"
import { PayoutBalanceCard } from "@/components/payouts/payout-balance-card"
import { FeeTransparency } from "@/components/payouts/fee-transparency"
import type { PayoutAccountDto, PayoutBalanceDto } from "@/lib/api/payout-types"

/** Saldo zerado até o provedor expor os valores reais — a UI mostra empty state, nunca mock. */
const EMPTY_BALANCE: PayoutBalanceDto = {
  currency: "BRL",
  availableCents: 0,
  pendingCents: 0,
  paidOutCents: 0,
  nextPayoutDate: null,
}

export const metadata = { title: "Recebimentos · MarcaAí" }

export default async function RecebimentosPage() {
  await requireOnboarded()

  // GET /payouts → primeira conta do usuário. Sem conta/erro → null (card exibe o CTA de ativação).
  let account: PayoutAccountDto | null = null
  try {
    const accounts = await serverApiFetch<PayoutAccountDto[]>(endpoints.payouts.root)
    account = accounts?.[0] ?? null
  } catch (err) {
    if (isApiError(err) && err.kind === "unauthorized") redirect("/login")
    // not_found/server/etc → segue sem conta (null): a UI mostra o estado de ativação.
  }

  const isActive = account?.status === "ACTIVE"

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ative sua conta e acompanhe o dinheiro das suas consultas.
        </p>
      </header>

      <PayoutStatusCard account={account} />

      <FeeTransparency />

      {/* Saldo/saques só aparecem com a conta ativa. Sem endpoint de saldo real ainda → saldo
          zerado + extrato vazio (empty state neutro), nunca dados de demonstração. */}
      {isActive && <PayoutBalanceCard balance={EMPTY_BALANCE} transactions={[]} />}

      <Link
        href="/dashboard/financeiro"
        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm shadow-sm transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <BarChart3 className="h-4 w-4" />
          </span>
          <span>
            <span className="font-medium">Painel financeiro</span>
            <span className="block text-xs text-muted-foreground">
              MRR, churn, LTV e faturamento do negócio
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  )
}
