"use client"

/**
 * Painel de pagamento com Cartão (Stripe Elements). Recebe o `clientSecret` da API (spec §3.3)
 * e monta o `PaymentElement`. O front NUNCA trafega o PAN — o cartão vive no iframe do Stripe.
 *
 * Requer as libs `@stripe/stripe-js` e `@stripe/react-stripe-js` e a env
 * `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Sem a chave, exibimos um aviso de configuração.
 */

import { useMemo, useState } from "react"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { CreditCard, Loader2, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> | null {
  if (!PK) return null
  if (!stripePromise) stripePromise = loadStripe(PK)
  return stripePromise
}

function CheckoutForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    // `redirect: "if_required"` mantém o paciente na página quando não há 3DS;
    // a confirmação PAID é detectada pelo polling do componente pai.
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    })
    if (err) {
      setError(err.message ?? "Não foi possível processar o cartão.")
      setSubmitting(false)
    }
    // Sem erro: aguarda o polling confirmar (ou o redirect de 3DS).
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <Button
        onClick={handlePay}
        disabled={!stripe || submitting}
        className="h-11 w-full rounded-xl text-white"
        style={{ background: "var(--brand, #0f9e8e)" }}
      >
        {submitting ? (
          <><Loader2 size={16} className="mr-1.5 animate-spin" /> Processando…</>
        ) : (
          <>Pagar com cartão</>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={13} className="text-care" /> Pagamento criptografado e processado pelo Stripe.
      </p>
    </div>
  )
}

export function StripePanel({ clientSecret, returnUrl }: { clientSecret: string; returnUrl: string }) {
  const stripe = useMemo(() => getStripe(), [])

  if (!stripe) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-warning/30 bg-warning/10 p-6 text-center">
        <AlertCircle className="h-6 w-6 text-warning" />
        <p className="mt-2 text-sm font-medium">Pagamento com cartão indisponível</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> para habilitar o Stripe Elements.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-brand-primary">
          <CreditCard size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Pagar com cartão</h3>
          <p className="text-xs text-muted-foreground">Crédito ou débito, em ambiente seguro.</p>
        </div>
      </div>
      <Elements
        stripe={stripe}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#0f9e8e", borderRadius: "12px", fontFamily: "Inter, system-ui, sans-serif" },
          },
        }}
      >
        <CheckoutForm returnUrl={returnUrl} />
      </Elements>
    </div>
  )
}
