/**
 * Consolidado financeiro da clínica (Fase 6.2 · spec §6.2). Server component (sem interação).
 *
 * Cards de topo: líquido total (destaque), taxas MarcaAí, ticket médio, consultas pagas. Abaixo,
 * o plano/fee vigente ("plano maior = fee menor"). Valores em centavos → `Intl` pt-BR/BRL. A
 * agregação vem do servidor — o front nunca soma centavos.
 */

import { Wallet, Receipt, Ticket, CheckCircle2, BadgePercent } from "lucide-react"
import { Stagger, StaggerItem } from "@/components/motion/primitives"
import { cn, formatBRLCents } from "@/lib/utils"
import type { TeamFinanceSummaryDto } from "@/lib/api/finance-types"

const PLAN_LABEL: Record<string, string> = {
  SOLO: "Solo",
  CLINICA: "Clínica",
  PRO: "Pro",
}

function feePct(bps: number): string {
  return `${(bps / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function Card({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Wallet
  featured?: boolean
}) {
  return (
    <StaggerItem
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        featured ? "border-brand-primary/30 bg-brand-primary/5" : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", featured ? "text-brand-primary" : "text-muted-foreground")} />
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", featured && "text-brand-primary")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </StaggerItem>
  )
}

export function TeamFinanceSummary({ summary }: { summary: TeamFinanceSummaryDto }) {
  const planName = PLAN_LABEL[summary.plan.planCode] ?? summary.plan.planCode

  return (
    <div className="space-y-4">
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card
          label="Líquido total"
          value={formatBRLCents(summary.netTotalCents)}
          hint={summary.period}
          icon={Wallet}
          featured
        />
        <Card
          label="Taxas MarcaAí"
          value={formatBRLCents(summary.platformFeesCents)}
          hint={`${feePct(summary.plan.defaultFeeBps)} por consulta`}
          icon={Receipt}
        />
        <Card label="Ticket médio" value={formatBRLCents(summary.avgTicketCents)} icon={Ticket} />
        <Card
          label="Consultas pagas"
          value={summary.paidBookingsCount.toLocaleString("pt-BR")}
          icon={CheckCircle2}
        />
      </Stagger>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <BadgePercent className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium">
              Plano {planName} · {summary.plan.quantity}{" "}
              {summary.plan.quantity === 1 ? "assento" : "assentos"}
            </p>
            <p className="text-xs text-muted-foreground">
              Taxa vigente de {feePct(summary.plan.defaultFeeBps)} por consulta paga.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Plano maior, fee menor: Solo 3,49% · Clínica 2,49% · Pro 1,99%.
        </p>
      </div>
    </div>
  )
}
