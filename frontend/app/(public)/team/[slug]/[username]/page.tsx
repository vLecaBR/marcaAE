import { redirect } from "next/navigation"

/**
 * Agendamento com um profissional dentro do contexto da clínica.
 * Enquanto o endpoint público de clínica não existe (docs/backend-backlog.md), redirecionamos
 * para a página individual do profissional, que já é 100% servida pela API. Sem Prisma.
 */
export default async function TeamMemberPublicPage({
  params,
}: {
  params: Promise<{ slug: string; username: string }>
}) {
  const { username } = await params
  redirect(`/${username}`)
}
