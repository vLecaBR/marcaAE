/**
 * Mocks da Clínica — Fase 6 (temporário).
 *
 * A listagem de equipes já existe no backend (`GET /teams`, `GET /teams/{id}`), mas nem todo
 * ambiente de desenvolvimento tem uma clínica populada. Quando o profissional ainda não pertence a
 * nenhuma clínica (ou a API está indisponível), a `Visão da Clínica` cai para estes dados de
 * demonstração — assim a tela fica sempre renderizável e "linda" para review, com o selo
 * "Dados de demonstração". A assinatura é a definitiva (`TeamDetailDto`): plugar o backend real é
 * apenas deixar de usar o mock.
 *
 * ⚠️ REMOVER/ignorar quando houver clínica real (grep por `MOCK_` / docs/backend-backlog.md).
 */

import type { TeamDetailDto } from "@/lib/api/types"

export const MOCK_CLINIC: TeamDetailDto = {
  id: "mock-clinic",
  name: "Clínica Bem-Estar (demo)",
  slug: "clinica-bem-estar",
  description:
    "Clínica de demonstração para você visualizar a gestão de equipe. Convide profissionais para começar.",
  logo: null,
  theme: "LIGHT",
  brandColor: "#0f9e8e",
  role: "OWNER",
  members: [
    { userId: "mock-owner", name: "Dra. Helena Marques", email: "helena@bemestar.demo", role: "OWNER" },
    { userId: "mock-admin", name: "Dr. Rafael Nunes", email: "rafael@bemestar.demo", role: "ADMIN" },
    { userId: "mock-m1", name: "Dra. Camila Ferraz", email: "camila@bemestar.demo", role: "MEMBER" },
    { userId: "mock-m2", name: "Dr. Bruno Alves", email: "bruno@bemestar.demo", role: "MEMBER" },
    { userId: "mock-m3", name: null, email: "novo.profissional@bemestar.demo", role: "MEMBER" },
  ],
}
