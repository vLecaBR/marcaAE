"use client"

/**
 * Gráfico de faturamento mensal (Fase 5 · spec §6.1). Client component (recharts).
 *
 * Área empilhada bruto × líquido, paleta Teal. Rótulos e tooltip em pt-BR/BRL. Respeita a
 * agregação do servidor (só renderiza a série; não soma). Responsivo/mobile-first via
 * `ResponsiveContainer`.
 */

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatBRLCents } from "@/lib/utils"
import type { RevenuePointDto } from "@/lib/api/finance-types"

const TEAL = "#0f9e8e" // --brand-primary
const SECONDARY = "#134e6f" // --brand-secondary

/** "2026-07" → "jul/26". */
function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number)
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1))
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(d)
    .replace(".", "")
  return `${mes}/${String(y).slice(2)}`
}

/** Compacta o eixo Y: 1128000 centavos → "R$ 11k". */
function compactBRL(cents: number): string {
  const reais = cents / 100
  if (reais >= 1000) return `R$ ${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`
  return `R$ ${reais.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
}

interface TooltipEntry {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium capitalize">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{formatBRLCents(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  )
}

export function RevenueChart({ series }: { series: RevenuePointDto[] }) {
  const data = useMemo(
    () =>
      series.map((p) => ({
        label: monthLabel(p.month),
        Bruto: p.grossCents,
        Líquido: p.netCents,
      })),
    [series],
  )

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6"
      aria-label="Faturamento mensal"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Faturamento</h2>
          <p className="text-sm text-muted-foreground">Bruto e líquido dos últimos 12 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL }} /> Bruto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SECONDARY }} /> Líquido
          </span>
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillBruto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TEAL} stopOpacity={0.35} />
                <stop offset="95%" stopColor={TEAL} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="fillLiquido" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SECONDARY} stopOpacity={0.25} />
                <stop offset="95%" stopColor={SECONDARY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={compactBRL}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="Bruto"
              stroke={TEAL}
              strokeWidth={2}
              fill="url(#fillBruto)"
            />
            <Area
              type="monotone"
              dataKey="Líquido"
              stroke={SECONDARY}
              strokeWidth={2}
              fill="url(#fillLiquido)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
