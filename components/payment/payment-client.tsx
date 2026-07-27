"use client"

/**
 * Orquestrador do checkout do paciente (spec §3.3, ADR-0002).
 * Seleção de método → cria a intenção via BFF (`POST /api/book/{uid}/pay`) → renderiza PIX ou
 * Stripe → acompanha a confirmação por polling (`usePaymentStatus`) → redireciona ao confirmar.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { QrCode, CreditCard, Loader2, CheckCircle2, Clock, ArrowLeft } from "lucide-react"
import { m } from "motion/react"
import { PixPanel } from "./pix-panel"
import { StripePanel } from "./stripe-panel"
import { usePaymentStatus } from "@/lib/hooks/use-payment-status"
import type { PaymentIntentDto, PaymentProviderName } from "@/lib/api/booking-types"
import { Card } from "@/components/ui/card"
import { useEffect } from "react"

function brl(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
}

export function PaymentClient({
  uid,
  eventTitle,
  ownerName,
  returnUrl,
}: {
  uid: string
  eventTitle: string
  ownerName: string | null
  returnUrl: string
}) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentProviderName | null>(null)
  const [intent, setIntent] = useState<PaymentIntentDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const poll = usePaymentStatus(uid, !!intent)

  // Confirmado → leva à tela de status/confirmação do agendamento.
  useEffect(() => {
    if (poll.phase === "paid") {
      const t = setTimeout(() => router.replace(`/booking/${uid}`), 1200)
      return () => clearTimeout(t)
    }
  }, [poll.phase, router, uid])

  async function choose(provider: PaymentProviderName) {
    setMethod(provider)
    setLoading(true)
    setError(null)
    setIntent(null)
    try {
      const res = await fetch(`/api/book/${uid}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
        credentials: "same-origin",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Não foi possível iniciar o pagamento.")
        setMethod(null)
      } else {
        setIntent(data as PaymentIntentDto)
      }
    } catch {
      setError("Falha de conexão. Tente novamente.")
      setMethod(null)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMethod(null)
    setIntent(null)
    setError(null)
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Resumo */}
      <div className="mb-5 text-center">
        <p className="text-sm text-muted-foreground">Pagamento da consulta</p>
        <h1 className="mt-1 text-xl font-semibold">{eventTitle}</h1>
        {ownerName && <p className="mt-0.5 text-sm text-muted-foreground">com {ownerName}</p>}
      </div>

      <Card className="rounded-2xl border-border/60 p-6 shadow-sm">
        {/* Seleção de método */}
        {!method && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Como você prefere pagar?</p>
            <button
              onClick={() => choose("MERCADO_PAGO")}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition hover:border-brand-primary hover:bg-secondary/50 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-brand-primary">
                <QrCode size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">PIX</span>
                <span className="block text-xs text-muted-foreground">Aprovação na hora</span>
              </span>
            </button>
            <button
              onClick={() => choose("STRIPE")}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition hover:border-brand-primary hover:bg-secondary/50 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-brand-primary">
                <CreditCard size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">Cartão de crédito ou débito</span>
                <span className="block text-xs text-muted-foreground">Pagamento seguro via Stripe</span>
              </span>
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* Carregando intenção */}
        {method && loading && (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm">Preparando o pagamento…</p>
          </div>
        )}

        {/* Painel do método */}
        {method && intent && !loading && (
          <div>
            <button
              onClick={reset}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={14} /> Trocar método
            </button>

            {typeof intent.amountCents === "number" && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold tabular-nums">{brl(intent.amountCents)}</span>
              </div>
            )}

            {method === "MERCADO_PAGO" ? (
              <PixPanel
                qrCodeBase64={intent.pixQrCodeBase64}
                qrCode={intent.pixQrCode}
                ticketUrl={intent.pixTicketUrl}
              />
            ) : intent.clientSecret ? (
              <StripePanel clientSecret={intent.clientSecret} returnUrl={returnUrl} />
            ) : (
              <p className="text-sm text-destructive">Falha ao iniciar o pagamento com cartão.</p>
            )}

            {/* Barra de status do polling */}
            <PollBar phase={poll.phase} />
          </div>
        )}
      </Card>
    </div>
  )
}

function PollBar({ phase }: { phase: ReturnType<typeof usePaymentStatus>["phase"] }) {
  if (phase === "idle") return null

  if (phase === "paid") {
    return (
      <m.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-care/10 px-4 py-3 text-sm font-medium text-care"
      >
        <CheckCircle2 size={16} /> Pagamento confirmado! Redirecionando…
      </m.div>
    )
  }

  if (phase === "timeout") {
    return (
      <div className="mt-5 rounded-xl bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
        Ainda não recebemos a confirmação. Assim que o pagamento cair, você recebe um e-mail — pode
        fechar esta página com segurança.
      </div>
    )
  }

  if (phase === "failed") {
    return (
      <div className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">
        O pagamento não foi aprovado. Tente novamente ou escolha outro método.
      </div>
    )
  }

  return (
    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
      <Clock size={14} className="animate-pulse" /> Estamos confirmando seu pagamento. Isso costuma
      levar alguns segundos.
    </div>
  )
}
