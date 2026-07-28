/**
 * TeamUsageStats — uso vs. limites do plano (Fase 8 · §8.1).
 *
 * Server-safe (sem `"use client"`): recebe o `TeamBillingDto` resolvido no servidor e desenha o
 * progresso dos três limites principais (agendamentos/mês, membros, tipos de consulta). A barra é
 * **Teal** por padrão, vira **âmbar** ≥ 80% e **vermelha** ao bater 100% — quando esgota, mostra um
 * link "Fazer upgrade" para `PLANS_ROUTE`. Limite `null` = ilimitado (badge, sem barra).
 *
 * O front **nunca deriva limites** (§2.6): usa exatamente `usage`/`limits` do backend. `limits`
 * ausente cai para os limites do plano vigente (`getPlanConfig`) como fallback (§8.1).
 */

import type { ComponentType, SVGProps } from "react"
import Link from "next/link"
import { Calendar, Users, Layers, Gauge, Infinity as InfinityIcon, ArrowUpRight } from "lucide-react"
import { PLANS_ROUTE } from "@/components/billing/premium-gate"
import { getPlanConfig } from "@/lib/plans/plan-config"
import type { TeamBillingDto } from "@/lib/api/billing-types"

/** Limiar (%) a partir do qual a barra vira âmbar de aviso. */
const WARN_THRESHOLD_PCT = 80

interface TeamUsageStatsProps {
  billing: TeamBillingDto
  className?: string
}

interface UsageRow {
  key: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  used: number
  /** `null` = ilimitado. */
  limit: number | null
}

function barColor(pct: number): string {
  if (pct >= 100) return "bg-destructive"
  if (pct >= WARN_THRESHOLD_PCT) return "bg-warning"
  return "bg-brand-primary"
}

function UsageRowItem({ row }: { row: UsageRow }) {
  const { label, icon: Icon, used, limit } = row
  const unlimited = limit === null
  // Clampa a barra em 100% para não estourar visualmente; os números mostram o valor real.
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  const isFull = !unlimited && used >= limit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-foreground">{label}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isFull && (
            <Link
              href={PLANS_ROUTE}
              className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive hover:bg-destructive/15"
            >
              Fazer upgrade <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
          {unlimited ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary">
              <InfinityIcon className="h-4 w-4" aria-hidden="true" /> Ilimitado
            </span>
          ) : (
            <span className={`text-sm tabular-nums ${isFull ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
              <span className="text-foreground">{used}</span> / {limit}
            </span>
          )}
        </div>
      </div>

      {!unlimited && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={label}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${barColor(pct)}`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function TeamUsageStats({ billing, className }: TeamUsageStatsProps) {
  const plan = getPlanConfig(billing.planCode)
  // Fallback defensivo (§8.1): sem `limits` do backend, usa os limites do plano vigente.
  const limits = billing.limits ?? plan.limits
  const { usage } = billing

  const rows: UsageRow[] = [
    { key: "bookings", label: "Agendamentos no mês", icon: Calendar, used: usage.bookingsThisMonth, limit: limits.maxBookingsPerMonth },
    { key: "members", label: "Profissionais na equipe", icon: Users, used: usage.membersCount, limit: limits.maxMembers },
    { key: "eventTypes", label: "Tipos de consulta", icon: Layers, used: usage.eventTypesCount, limit: limits.maxEventTypes },
  ]

  return (
    <section className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm ${className ?? ""}`}>
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <Gauge className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold">Uso do plano {plan.name}</h2>
        </div>
        <Link href={PLANS_ROUTE} className="text-xs font-medium text-brand-primary hover:underline">
          Ver planos
        </Link>
      </header>

      <div className="space-y-4">
        {rows.map((row) => (
          <UsageRowItem key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
}
