"use client"

import { useState } from "react"
import { createCheckoutSessionAction } from "@/lib/actions/billing"
import { CreditCard, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CheckoutButton({ teamId, isSubscribed }: { teamId: string, isSubscribed: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createCheckoutSessionAction(teamId)

    if ("url" in result) {
      window.location.assign(result.url)
    } else {
      alert(result.error ?? "Erro ao gerar pagamento")
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      variant={isSubscribed ? "secondary" : "default"}
      className="w-full rounded-xl py-3 h-auto"
    >
      {loading ? (
        <span className="animate-pulse">Aguarde...</span>
      ) : isSubscribed ? (
        <>
          Gerenciar Assinatura
          <ExternalLink className="h-4 w-4" />
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Assinar Agora
        </>
      )}
    </Button>
  )
}
