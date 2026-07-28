"use client"

import { useState } from "react"
import { createCheckoutSessionAction } from "@/lib/actions/billing"
import { CreditCard, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export function CheckoutButton({ teamId, isSubscribed }: { teamId: string, isSubscribed: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createCheckoutSessionAction(teamId)

    if ("url" in result) {
      window.location.href = result.url
    } else {
      alert(result.error ?? "Erro ao gerar pagamento")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.98]",
        isSubscribed
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/70"
          : "bg-brand-primary text-white hover:bg-brand-primary/90"
      )}
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
    </button>
  )
}
