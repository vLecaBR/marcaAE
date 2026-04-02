import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TeamMembersList } from "./components/team-members-list"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Detalhes da Equipe | MarcaAí" }

export default async function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } }
        },
        orderBy: { role: "asc" }
      }
    }
  })

  if (!team) redirect("/dashboard/teams")

  const currentMember = team.members.find(m => m.userId === session.user.id)
  if (!currentMember) redirect("/dashboard/teams")

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/teams"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {team.slug} • Gerencie os membros e configurações da equipe.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TeamMembersList 
            teamId={team.id} 
            members={team.members} 
            currentUserRole={currentMember.role}
            currentUserId={session.user.id}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="text-base font-semibold text-white">Informações</h3>
            <div className="mt-4 space-y-4 text-sm text-zinc-400">
              <div>
                <p className="font-medium text-zinc-300">Link Público</p>
                <a href={`/team/${team.slug}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
                  marcaai.com/team/{team.slug}
                </a>
              </div>
              {team.description && (
                <div>
                  <p className="font-medium text-zinc-300">Descrição</p>
                  <p className="mt-1">{team.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
