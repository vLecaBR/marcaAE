/**
 * Mocks do Financeiro da Clínica — Fase 6.2 (temporário).
 *
 * O `FinanceController` (`GET /finance/teams/{teamId}/summary`) ainda não está finalizado
 * (docs/backend-backlog.md §BLOQUEIA FASE 5). Enquanto isso, `/dashboard/team/financeiro` consome
 * estes dados para a interface ficar completa e "linda" para review, com o selo
 * "Dados de demonstração". A assinatura é a definitiva (`TeamFinanceSummaryDto`) — plugar o backend
 * real é só deixar de usar o mock; a agregação continua sendo do servidor.
 *
 * ⚠️ REMOVER/ignorar ao plugar o backend (grep por `MOCK_` / docs/backend-backlog.md).
 */

import type { TeamFinanceSummaryDto } from "@/lib/api/finance-types"

export const MOCK_TEAM_FINANCE: TeamFinanceSummaryDto = {
  teamId: "mock-clinic",
  currency: "BRL",
  period: "Julho de 2026",
  netTotalCents: 4_868_00,
  platformFeesCents: 124_00,
  avgTicketCents: 214_00,
  paidBookingsCount: 61,
  plan: { planCode: "CLINICA", quantity: 5, defaultFeeBps: 249 },
  byProfessional: [
    { userId: "mock-owner", name: "Dra. Helena Marques", role: "OWNER", netCents: 1_842_00, paidBookingsCount: 22, shareCents: null },
    { userId: "mock-admin", name: "Dr. Rafael Nunes", role: "ADMIN", netCents: 1_356_00, paidBookingsCount: 17, shareCents: null },
    { userId: "mock-m1", name: "Dra. Camila Ferraz", role: "MEMBER", netCents: 986_00, paidBookingsCount: 13, shareCents: null },
    { userId: "mock-m2", name: "Dr. Bruno Alves", role: "MEMBER", netCents: 684_00, paidBookingsCount: 9, shareCents: null },
  ],
}
