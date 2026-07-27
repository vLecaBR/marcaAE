/**
 * Cards de métricas consolidadas (Fase 5 · spec §6.1). Server component (sem interação).
 *
 * Destaque para MRR · Churn · LTV (pedido do produto), com métricas de apoio (ARR, ARPU,
 * assinaturas ativas). Formata centavos com `Intl` (pt-BR/BRL). Cores da paleta Healthtech:
 * tendência positiva = `care`, negativa = `destructive`.
 */

import { TrendingUp, TrendingDown, Users, Repeat, HeartCrack, Gem, CircleDollarSign, Activity } from "lucide-react"
import { Stagger, StaggerItem } from "@/components/motion/primitives"
import { cn, formatBRLCents } from "@/lib/utils"
import type { MetricsSummaryDto } from "@/lib/api/finance-types"

function pct(value: number): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

type Tone = "positive" | "negative" | "neutral"

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
  delta,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Repeat
  featured?: boolean
  delta?: { value: string; tone: Tone; up: boolean }
}) {
  return (
    <StaggerItem
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        featured
          ? "border-brand-primary/30 bg-brand-primary/5"
          : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            featured ? "bg-brand-primary/15 text-brand-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              delta.tone === "positive" && "bg-care/10 text-care",
              delta.tone === "negative" && "bg-destructive/10 text-destructive",
              delta.tone === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {delta.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </StaggerItem>
  )
}

export function MetricCards({ summary }: { summary: MetricsSummaryDto }) {
  const growthUp = summary.mrrGrowthPct >= 0
  // Churn: menor é melhor. Tratamos como "negativo" (vermelho) por ser perda de receita.
  const netSubs = summary.newSubscriptions - summary.canceledSubscriptions

  return (
    <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" gap={0.04}>
      <MetricCard
        label="MRR — Receita recorrente mensal"
        value={formatBRLCents(summary.mrrCents)}
        icon={Repeat}
        featured
        delta={{
          value: pct(Math.abs(summary.mrrGrowthPct)),
          tone: growthUp ? "positive" : "negative",
          up: growthUp,
        }}
      />
      <MetricCard
        label="Churn mensal"
        value={pct(summary.churnRatePct)}
        hint="da receita perdida"
        icon={HeartCrack}
        delta={{ value: pct(summary.churnRatePct), tone: "negative", up: false }}
      />
      <MetricCard
        label="LTV — Valor do cliente"
        value={formatBRLCents(summary.ltvCents)}
        hint="média por cliente"
        icon={Gem}
      />
      <MetricCard
        label="ARR — Receita anual"
        value={formatBRLCents(summary.arrCents)}
        hint="≈ MRR × 12"
        icon={CircleDollarSign}
      />
      <MetricCard
        label="ARPU — Receita por conta"
        value={formatBRLCents(summary.arpuCents)}
        icon={Activity}
      />
      <MetricCard
        label="Assinaturas ativas"
        value={summary.activeSubscriptions.toLocaleString("pt-BR")}
        hint={`+${summary.newSubscriptions} novas · −${summary.canceledSubscriptions} canceladas`}
        icon={Users}
        delta={{
          value: `${netSubs >= 0 ? "+" : "−"}${Math.abs(netSubs)}`,
          tone: netSubs >= 0 ? "positive" : "negative",
          up: netSubs >= 0,
        }}
      />
    </Stagger>
  )
}
