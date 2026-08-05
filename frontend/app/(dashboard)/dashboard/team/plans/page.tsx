/**
 * Redirect legado (bug 2). A tela de planos agora é a rota **neutra** `/dashboard/plans`
 * (`PLANS_ROUTE`), acessível fora do contexto de clínica e sempre linkada no menu. Esta rota
 * antiga vivia sob `dashboard/team/**` (gated por `requireClinicPlan`), o que dava a impressão
 * de que a tela "sumia" para quem não estava numa trilha clínica ativa.
 *
 * Mantemos a URL viva apenas para bookmarks/CTAs legados: redireciona para a tela neutra.
 */

import { redirect } from "next/navigation"

export default function LegacyTeamPlansPage() {
  redirect("/dashboard/plans")
}
