/**
 * Configuração central de planos — Fase 8 (§8.1).
 *
 * ✅ FONTE ÚNICA no front para: preço de assinatura, fee (bps), limites de uso e flags de features
 * premium por plano. **Nenhum preço/limite deve ser hardcoded fora deste arquivo** (spec §8.1).
 *
 * ⚠️ O backend continua sendo a **fonte da verdade** (spec §2.5): este mapa serve para (a) exibir
 * valores/limites e (b) **fallback** quando o `TeamBillingDto` ainda não trouxer `limits`. O front
 * nunca "libera" um recurso por conta própria — o gating aqui é UX; cada request é revalidada no
 * backend (403 → tela amigável).
 *
 * Valores monetários em **centavos** (BRL). Fees em **basis points** (bps): 349 = 3,49%.
 */

export type PlanCode = "SOLO" | "SOLO_PRO" | "CLINICA" | "CLINICA_PRO"

/**
 * Trilha do plano — separa a via **individual** (1 profissional) da via **clínica**
 * (multiprofissional). Consumido pelo gating de menu/rotas (Q2) e pela tela de planos
 * neutra (Q3) para decidir o que exibir a cada usuário.
 */
export type PlanAudience = "individual" | "clinic"

/**
 * Features "premium" gateáveis via `<PremiumGate feature="...">` (a construir em 8.1).
 * Cada plano libera um subconjunto; durante o trial (§8.2) todas ficam liberadas.
 */
export type PremiumFeature =
  /** Financeiro consolidado da clínica (`/dashboard/team/financeiro`, F6.2). */
  | "team_finance"
  /** Lembretes automáticos via WhatsApp. */
  | "whatsapp_reminders"
  /** Cor de marca / personalização visual da página pública. */
  | "custom_branding"
  /** Relatórios avançados e exportação. */
  | "advanced_reports"
  /** Suporte prioritário. */
  | "priority_support"

/** Limites de uso do plano. `null` = ilimitado. */
export interface PlanLimits {
  /** Agendamentos pagos por mês. */
  maxBookingsPerMonth: number | null
  /** Membros na clínica (assentos). */
  maxMembers: number | null
  /** Tipos de consulta ativos. */
  maxEventTypes: number | null
}

/** Configuração completa de um plano. */
export interface PlanConfig {
  planCode: PlanCode
  /** Rótulo de exibição (pt-BR). */
  name: string
  /** Trilha do plano: individual (1 prof) ou clínica (multiprof). */
  audience: PlanAudience
  /** Mensalidade em centavos (BRL). `0` = plano base gratuito. */
  monthlyPriceCents: number
  /** Fee da plataforma em basis points (spec §1.4 / F6.2). */
  feeBps: number
  limits: PlanLimits
  /** Features premium liberadas por este plano. */
  premiumFeatures: PremiumFeature[]
  /** Hierarquia para comparações de upgrade/downgrade (maior = melhor). */
  order: number
}

/**
 * Mapa canônico dos planos vigentes (spec §1.4 / §8.1).
 * Fees: SOLO 3,49% · CLINICA 2,49% · PRO 1,99% ("plano maior, fee menor").
 *
 * ⚠️ Preços são placeholders alinháveis ao Stripe/backend; o backend confirma o valor cobrado.
 * SOLO é o **plano base** (gratuito, fee maior) — é para onde o trial faz downgrade ao expirar (§8.2).
 */
export const PLAN_CONFIG: Record<PlanCode, PlanConfig> = {
  SOLO: {
    planCode: "SOLO",
    name: "Solo",
    monthlyPriceCents: 0,
    feeBps: 349,
    limits: { maxBookingsPerMonth: 50, maxMembers: 1, maxEventTypes: 3 },
    premiumFeatures: [],
    order: 0,
  },
  CLINICA: {
    planCode: "CLINICA",
    name: "Clínica",
    monthlyPriceCents: 49_00,
    feeBps: 249,
    limits: { maxBookingsPerMonth: null, maxMembers: 10, maxEventTypes: null },
    premiumFeatures: ["team_finance", "whatsapp_reminders", "custom_branding"],
    order: 1,
  },
  PRO: {
    planCode: "PRO",
    name: "Pro",
    monthlyPriceCents: 99_00,
    feeBps: 199,
    limits: { maxBookingsPerMonth: null, maxMembers: null, maxEventTypes: null },
    premiumFeatures: [
      "team_finance",
      "whatsapp_reminders",
      "custom_branding",
      "advanced_reports",
      "priority_support",
    ],
    order: 2,
  },
}

/** Ordem de exibição/upgrade (do menor para o maior). */
export const PLAN_ORDER: readonly PlanCode[] = ["SOLO", "CLINICA", "PRO"] as const

/** Rótulos pt-BR das features premium (reuso em pricing table e `PremiumGate`). */
export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  team_finance: "Financeiro consolidado da clínica",
  whatsapp_reminders: "Lembretes automáticos no WhatsApp",
  custom_branding: "Personalização de marca na página pública",
  advanced_reports: "Relatórios avançados e exportação",
  priority_support: "Suporte prioritário",
}

/** Fee (bps) formatado em % pt-BR (ex.: 349 → "3,49%"). */
export function formatFeeBps(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(".", ",")}%`
}

/**
 * Linhas de "o que está incluso" de um plano — limites (do mapa) + features premium.
 * Fonte única de copy das pricing tables (pública e do dashboard), 100% derivada de `PLAN_CONFIG`.
 */
export function planFeatureLines(plan: PlanConfig): string[] {
  const { maxBookingsPerMonth, maxMembers, maxEventTypes } = plan.limits
  const members =
    maxMembers === null
      ? "Profissionais ilimitados"
      : `${maxMembers} ${maxMembers === 1 ? "profissional" : "profissionais"}`
  return [
    maxBookingsPerMonth === null
      ? "Agendamentos ilimitados"
      : `${maxBookingsPerMonth} agendamentos por mês`,
    members,
    maxEventTypes === null ? "Tipos de consulta ilimitados" : `${maxEventTypes} tipos de consulta`,
    `Taxa de ${formatFeeBps(plan.feeBps)} por consulta`,
    ...plan.premiumFeatures.map((f) => PREMIUM_FEATURE_LABELS[f]),
  ]
}

/** Plano base para onde o trial faz downgrade ao expirar (§8.2). */
export const BASE_PLAN_CODE: PlanCode = "SOLO"

// ---------------------------------------------------------------------------
// Helpers de leitura/gating (UX — o backend é a fonte da verdade, spec §2.5)
// ---------------------------------------------------------------------------

/** Config de um plano com fallback seguro no plano base se `planCode` for desconhecido. */
export function getPlanConfig(planCode: string | null | undefined): PlanConfig {
  if (planCode && planCode in PLAN_CONFIG) return PLAN_CONFIG[planCode as PlanCode]
  return PLAN_CONFIG[BASE_PLAN_CODE]
}

/** É um plano pago (não o base gratuito)? */
export function isPaidPlan(planCode: string | null | undefined): boolean {
  return getPlanConfig(planCode).monthlyPriceCents > 0
}

/** O plano libera esta feature premium por si só (ignora trial)? */
export function planHasFeature(planCode: string | null | undefined, feature: PremiumFeature): boolean {
  return getPlanConfig(planCode).premiumFeatures.includes(feature)
}

/**
 * Acesso premium efetivo (§8.2): durante o trial, tudo liberado; senão, depende do plano.
 * Uma única checagem reutilizada pelo `<PremiumGate>` (8.1) e pela UI de trial (8.2).
 */
export function hasPremiumAccess(args: {
  planCode: string | null | undefined
  isTrialing: boolean
}): boolean {
  return args.isTrialing || isPaidPlan(args.planCode)
}

/** Pode usar uma feature específica: liberada no trial OU incluída no plano atual. */
export function canUseFeature(
  feature: PremiumFeature,
  args: { planCode: string | null | undefined; isTrialing: boolean },
): boolean {
  return args.isTrialing || planHasFeature(args.planCode, feature)
}

/**
 * Menor plano pago que inclui a feature — alvo do CTA "fazer upgrade" no `<PremiumGate>`.
 * Retorna `null` se nenhum plano oferecer (não deveria acontecer para features existentes).
 */
export function minPlanForFeature(feature: PremiumFeature): PlanConfig | null {
  for (const code of PLAN_ORDER) {
    if (PLAN_CONFIG[code].premiumFeatures.includes(feature)) return PLAN_CONFIG[code]
  }
  return null
}
