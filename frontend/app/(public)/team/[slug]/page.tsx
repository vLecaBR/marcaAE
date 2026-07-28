import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Building2 } from "lucide-react"

export const metadata: Metadata = { title: "Clínica" }

/**
 * Página pública da clínica — aguardando o endpoint `GET /public/team/{slug}` no backend
 * (registrado em docs/backend-backlog.md). Sem Prisma. Enquanto o contrato não existir,
 * exibimos um estado acolhedor em vez de erro.
 */
export default async function TeamPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  await params
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="px-6 py-5 border-b border-border/60">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><Logo size={24} /></Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand-primary">
          <Building2 size={26} />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Página da clínica em breve</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          O agendamento coletivo da clínica estará disponível em breve. Enquanto isso, você pode
          agendar diretamente com um profissional pelo link individual dele.
        </p>
      </main>
    </div>
  )
}
