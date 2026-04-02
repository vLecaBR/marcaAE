import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { QrCard } from "./components/qr-card"

export default async function MarketingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: { where: { userId: session.user.id } }
    }
  })

  if (!team || team.members.length === 0) redirect("/dashboard/teams")

  if (team.members[0].role !== "OWNER" && team.members[0].role !== "ADMIN") {
    redirect(`/dashboard/teams/${team.id}`)
  }

  const teamUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/${team.slug}`

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4 print:hidden">
        <Link 
          href={`/dashboard/teams/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Marketing</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Materiais para balcão e espelho para facilitar o agendamento.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:block">
        <div className="space-y-6 print:hidden">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="text-base font-semibold text-white">Cartaz de Mesa</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Imprima este QR Code e coloque no seu estabelecimento. Quando o cliente apontar a câmera, ele será direcionado diretamente para a página de agendamentos da sua equipe.
            </p>
            
            <div className="mt-6">
              <QrCard teamName={team.name} url={teamUrl} />
            </div>
          </div>
        </div>
        
        {/* Este card fica isolado e pronto para a impressão, o resto é escondido via Tailwind print:hidden */}
        <div className="hidden print:flex flex-col items-center justify-center min-h-screen">
          <QrCard teamName={team.name} url={teamUrl} isPrintView />
        </div>
      </div>
    </div>
  )
}
