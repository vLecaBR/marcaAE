"use client"

/**
 * CTA de troca de plano na pricing table (Fase 8 · §8.1).
 *
 * Inicia o fluxo de billing via `createCheckoutSessionAction` (mesma action da assinatura). O
 * backend decide entre checkout/portal e retorna `{ url }`; qualquer falha cai no alerta de erro.
 *
 * ⚠️ Gap de backend: a action ainda não recebe `planCode` (checkout por plano). Ao abrir esse gap,
 * passar `targetPlan` adiante; a UI aqui não muda.
 */

import { useState } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { createCheckoutSessionAction } from "@/lib/actions/billing"
import { cn } from "@/lib/utils"
import type { PlanCode } from "@/lib/plans/plan-config"

interface PlanActionButtonProps {
  teamId: string
  targetPlan: PlanCode
  direction: "upgrade" | "downgrade"
}

export function PlanActionButton({ teamId, direction }: PlanActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const isUpgrade = direction === "upgrade"

  async function handleClick() {
    setLoading(true)
    const result = await createCheckoutSessionAction(teamId)
    if ("url" in result) {
      window.location.assign(result.url)
    } else {
      alert(result.error ?? "Não foi possível iniciar a troca de plano.")
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60",
        isUpgrade
          ? "bg-brand-primary text-white hover:bg-brand-primary/90"
          : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {loading ? (
        <span className="animate-pulse">Aguarde…</span>
      ) : (
        <>
          {isUpgrade ? "Fazer upgrade" : "Fazer downgrade"}
          {isUpgrade ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </>
      )}
    </button>
  )
}
