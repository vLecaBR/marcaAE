/**
 * PremiumGate — bloqueio de features premium (Fase 8 · §8.1).
 *
 * Server-safe (sem `"use client"`): recebe a `feature` e o `TeamBillingDto` já resolvido pela
 * página/layout. Se o usuário tem acesso — plano pago que inclui a feature **ou** trial ativo
 * (§8.2) — renderiza `children`. Senão, mostra um card de bloqueio elegante (paleta Teal, no
 * espírito do `EmptyState`) com CTA para escolher plano.
 *
 * ⚠️ **Defesa em profundidade** (§2.5): isto é UX. O backend continua validando cada request
 * (403 → tela amigável). O front nunca "libera" um recurso sozinho.
 *
 * Uso:
 *   <PremiumGate feature="team_finance" billing={billing}>
 *     <TeamFinanceSummary summary={finance} />
 *   </PremiumGate>
 */

import type { ReactNode } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBRLCents } from "@/lib/utils"
import { canUseFeature, minPlanForFeature, type PremiumFeature } from "@/lib/plans/plan-config"
import type { TeamBillingDto } from "@/lib/api/billing-types"

/** Rota da tela de planos/upgrade (Fase 8 · §8.1) — destino padrão dos CTAs de upgrade. */
export const PLANS_ROUTE = "/dashboard/team/plans"

interface PremiumGateProps {
  /** Feature exigida (mapeada em `plan-config.ts`). */
  feature: PremiumFeature
  /** Estado de billing/plano/trial resolvido no servidor. */
  billing: TeamBillingDto
  /** Conteúdo liberado quando há acesso. */
  children: ReactNode
  /** Sobrescreve o título do estado bloqueado. */
  title?: string
  /** Sobrescreve a descrição do estado bloqueado. */
  description?: string
  /** Sobrescreve o destino do CTA de upgrade. */
  upgradeHref?: string
  className?: string
}

export function PremiumGate({
  feature,
  billing,
  children,
  title,
  description,
  upgradeHref = PLANS_ROUTE,
  className,
}: PremiumGateProps) {
  const unlocked = canUseFeature(feature, {
    planCode: billing.planCode,
    isTrialing: billing.trial.isTrialing,
  })

  if (unlocked) return <>{children}</>

  const minPlan = minPlanForFeature(feature)
  const fallbackDescription = minPlan
    ? `Disponível no plano ${minPlan.name} (${formatBRLCents(minPlan.monthlyPriceCents)}/mês) ou superior.`
    : "Disponível nos planos pagos do MarcaAí."

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card px-6 py-12 text-center shadow-sm ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary"
      >
        <Lock className="h-7 w-7" />
      </span>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {title ?? "Recurso premium"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description ?? fallbackDescription}
        </p>
      </div>

      <Button asChild className="mt-2 rounded-xl">
        <Link href={upgradeHref}>Ver planos</Link>
      </Button>
    </div>
  )
}
