import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CheckoutButton } from "./components/checkout-button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

export default async function TeamBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      subscription: true,
      members: { where: { userId: session.user.id } }
    }
  })

  if (!team || team.members.length === 0) redirect("/dashboard/teams")

  const isOwner = team.members[0].role === "OWNER"
  const isSubscribed = team.subscription?.status === "active"

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/teams/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Faturamento</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie o plano e os pagamentos da equipe {team.name}.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Plano B2B SaaS</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-md">
              Libere o agendamento coletivo para seus profissionais, notificações automáticas, relatórios financeiros e suporte prioritário.
            </p>
            
            <div className="mt-6 space-y-3">
              {["Agendamentos Ilimitados", "Membros Ilimitados na Equipe", "Links de Pagamento Automático (Pix/Cartão)", "Lembretes Automáticos via WhatsApp"].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-5 w-5 text-violet-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 p-6 md:w-72">
            <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">MENSALIDADE</p>
            <div className="flex items-baseline gap-1 text-white">
              <span className="text-3xl font-bold">R$</span>
              <span className="text-5xl font-black tracking-tight">49</span>
              <span className="text-sm font-medium text-zinc-500">/mês</span>
            </div>
            
            {isSubscribed ? (
              <div className="mt-6 w-full rounded-lg bg-emerald-500/10 py-2.5 text-center text-sm font-medium text-emerald-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Plano Ativo
              </div>
            ) : (
              <div className="mt-6 w-full rounded-lg bg-amber-500/10 py-2.5 text-center text-sm font-medium text-amber-500 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pagamento Pendente
              </div>
            )}

            <div className="mt-4 w-full">
              {isOwner ? (
                <CheckoutButton teamId={team.id} isSubscribed={isSubscribed} />
              ) : (
                <p className="text-center text-xs text-zinc-500">Apenas o proprietário pode gerenciar a assinatura.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
