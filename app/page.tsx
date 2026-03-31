import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Calendar, Clock, Globe2, Link as LinkIcon, ShieldCheck, Sparkles } from "lucide-react"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    if (!session.user.onboarded) redirect("/onboarding")
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] selection:bg-violet-500/30">
      {/* Navbar Minimalista */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Marca<span className="text-violet-400">Aí</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl opacity-30 pointer-events-none">
            <div className="aspect-[2/1] bg-gradient-to-b from-violet-600 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 mb-8">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">
                A nova forma de organizar sua agenda
              </span>
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.1]">
              Agendamentos que <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                funcionam para você
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed">
              Ideal para barbearias, clínicas, consultorias e profissionais autônomos.
              Compartilhe seu link e deixe seus clientes escolherem o melhor horário.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-violet-600 px-8 py-4 text-base font-medium text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
              >
                Começar gratuitamente
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Conheça os recursos
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-white/5 bg-zinc-950 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Tudo que você precisa para crescer
              </h2>
              <p className="mt-4 text-zinc-400">
                Foque no seu serviço, nós cuidamos da agenda.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard 
                icon={<Clock className="h-6 w-6 text-fuchsia-400" />}
                title="Sua agenda, suas regras"
                description="Configure seus horários de trabalho, intervalos, dias de folga e antecedência mínima."
              />
              <FeatureCard 
                icon={<Globe2 className="h-6 w-6 text-violet-400" />}
                title="Página pública exclusiva"
                description="Uma vitrine elegante com a sua marca onde seus clientes podem ver todos os seus serviços."
              />
              <FeatureCard 
                icon={<LinkIcon className="h-6 w-6 text-blue-400" />}
                title="Links rápidos"
                description="Compartilhe links diretos para serviços específicos via WhatsApp ou Instagram."
              />
              <FeatureCard 
                icon={<ShieldCheck className="h-6 w-6 text-emerald-400" />}
                title="Sem conflitos"
                description="Nosso sistema garante que nunca haverá dois agendamentos no mesmo horário."
              />
              <FeatureCard 
                icon={<Calendar className="h-6 w-6 text-amber-400" />}
                title="Múltiplos Serviços"
                description="Ofereça diferentes tipos de serviços, cada um com sua própria duração e regras."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-32 border-t border-white/5">
          <div className="absolute inset-0 bg-violet-600/10" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Pronto para lotar sua agenda?
            </h2>
            <p className="text-lg text-zinc-300 mb-10">
              Junte-se a dezenas de profissionais que simplificaram suas rotinas.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-transform hover:scale-105"
            >
              Criar conta agora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
              <Calendar className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-white">MarcaAí</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} MarcaAí. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-800/80 hover:border-zinc-700">
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700 group-hover:bg-zinc-700 transition-colors">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}