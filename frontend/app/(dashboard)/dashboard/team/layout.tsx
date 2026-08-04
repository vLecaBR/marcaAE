import { requireClinicPlan } from "@/lib/auth/guards"

/**
 * Guarda do escopo de Clínica — Q2 (`docs/spec_q.md`). Cobre todas as rotas aninhadas de
 * `dashboard/team/**`. Usuários de plano individual (Solo/Solo Pro) que tentem acessar por URL
 * direta são redirecionados para `/dashboard` (defesa em profundidade sobre o gating de menu).
 *
 * O backend permanece como fonte da verdade (revalida cada request, 403 → tela amigável).
 */
export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireClinicPlan()
  return <>{children}</>
}
