/**
 * Receita por profissional (Fase 6.2 · spec §6.2). Server component (sem interação).
 *
 * Lista densa e clara: cada membro da clínica com papel, consultas pagas e líquido gerado no
 * período. A coluna "Sua fatia" (rateio interno) é **reservada** mas sem cálculo — depende de
 * `RevenueShareRule` (v2, backlog §Futuro). Valores em centavos → `Intl` pt-BR/BRL.
 */

import { formatBRLCents } from "@/lib/utils"
import { RoleBadge } from "@/components/team/role-badge"
import type { TeamFinanceSummaryDto } from "@/lib/api/finance-types"

function initialOf(name: string | null, fallback: string): string {
  return (name?.trim()?.[0] ?? fallback).toUpperCase()
}

export function ProfessionalRevenueList({ summary }: { summary: TeamFinanceSummaryDto }) {
  const rows = summary.byProfessional

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Receita por profissional</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Líquido gerado por cada membro em {summary.period.toLowerCase()}.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-2.5 text-left font-medium sm:px-6">
                Profissional
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Consultas
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Líquido
              </th>
              <th scope="col" className="hidden px-5 py-2.5 text-right font-medium sm:table-cell sm:px-6">
                <span className="inline-flex items-center gap-1.5">
                  Sua fatia
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    em breve
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((p) => (
              <tr key={p.userId} className="transition hover:bg-muted/30">
                <td className="px-5 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-care text-xs font-semibold text-white">
                      {initialOf(p.name, "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name || "Convite pendente"}</p>
                      <RoleBadge role={p.role} className="mt-0.5" />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                  {p.paidBookingsCount}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {formatBRLCents(p.netCents)}
                </td>
                <td className="hidden px-5 py-3 text-right tabular-nums text-muted-foreground sm:table-cell sm:px-6">
                  {p.shareCents != null ? formatBRLCents(p.shareCents) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/60 bg-muted/20 font-medium">
              <td className="px-5 py-3 sm:px-6">Total da clínica</td>
              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                {summary.paidBookingsCount}
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-brand-primary">
                {formatBRLCents(summary.netTotalCents)}
              </td>
              <td className="hidden px-5 py-3 text-right text-muted-foreground sm:table-cell sm:px-6">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
