/**
 * Vitrine pública de planos (Landing · Fase 8 · §8.1).
 *
 * Server-safe: mapeia o **mesmo `PLAN_CONFIG`** do produto — sem preços/limites hardcoded. Foco em
 * conversão: destaque no plano CLINICA ("Popular"), paleta Teal e CTAs apontando para o cadastro
 * (`/login`). Toda nova conta entra com 30 dias de teste grátis (§8.2), reforçado no cabeçalho.
 */

import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  planFeatureLines,
  formatFeeBps,
} from "@/lib/plans/plan-config"
import { formatBRLCents } from "@/lib/utils"

/** Rota de cadastro/login (destino dos CTAs de assinatura). */
const SIGNUP_ROUTE = "/login"
/** Plano em destaque. */
const RECOMMENDED_PLAN = "CLINICA"

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
          <Sparkles size={12} /> 30 dias grátis em qualquer plano
        </span>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8 }}>
          Planos que crescem com a sua clínica
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground" style={{ lineHeight: 1.6 }}>
          Comece grátis e evolua quando quiser. Quanto maior o plano, menor a taxa por consulta — sem
          fidelidade, cancele quando precisar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-start">
        {PLAN_ORDER.map((code) => {
          const plan = PLAN_CONFIG[code]
          const isRecommended = plan.planCode === RECOMMENDED_PLAN
          const isFree = plan.monthlyPriceCents === 0

          return (
            <div
              key={code}
              className={
                isRecommended
                  ? "relative flex flex-col rounded-3xl border-2 border-brand-primary bg-card p-8 shadow-xl md:-mt-3 md:pb-10"
                  : "relative flex flex-col rounded-3xl border border-border/60 bg-card p-8 shadow-sm"
              }
            >
              {isRecommended && (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-primary px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Mais popular
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Taxa de {formatFeeBps(plan.feeBps)} por consulta
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                {isFree ? (
                  <span className="text-4xl font-black tracking-tight">Grátis</span>
                ) : (
                  <>
                    <span className="text-4xl font-black tracking-tight">
                      {formatBRLCents(plan.monthlyPriceCents)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </>
                )}
              </div>

              <Link
                href={SIGNUP_ROUTE}
                className={
                  isRecommended
                    ? "mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
                    : "mt-6 inline-flex w-full items-center justify-center rounded-xl border border-brand-primary/40 bg-brand-primary/5 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
                }
              >
                {isFree ? "Começar grátis" : "Testar 30 dias grátis"}
              </Link>

              <ul className="mt-7 space-y-3">
                {planFeatureLines(plan).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Sem cartão de crédito para começar. Você só escolhe um plano pago se decidir continuar após o
        teste.
      </p>
    </section>
  )
}
