/**
 * Faixa de transparência de taxa (Fase 4 · spec §5.3). Server component (sem interação).
 *
 * O `%` real vem do plano vigente (F6 · `defaultFeeBps`); enquanto o `FinanceController` não
 * expõe o plano, usamos o fee padrão Solo (3,49%). Copy acolhedora, sem jargão (spec §5/§8).
 */

import { Percent } from "lucide-react"

/** Fee padrão do plano Solo em pontos-base (spec §7 — Solo 3,49%). Substituir pelo plano real (F6). */
const DEFAULT_FEE_BPS = 349

export function FeeTransparency({ feeBps = DEFAULT_FEE_BPS }: { feeBps?: number }) {
  const feePct = (feeBps / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
        <Percent className="h-4 w-4" />
      </div>
      <p className="text-sm text-foreground/80">
        A cada consulta paga, uma taxa de{" "}
        <span className="font-semibold text-foreground">{feePct}%</span> é retida pela MarcaAí; o
        restante vai direto para você. Sem mensalidade nem surpresas.
      </p>
    </div>
  )
}
