// app/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    if (!session.user.onboarded) redirect("/onboarding")
    redirect("/dashboard")
  }

  // Landing page para visitantes não autenticados
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4">
      <div className="mx-auto max-w-2xl text-center space-y-8">

        {/* Logo */}
        <div className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </span>
          <span className="text-2xl font-semibold tracking-tight text-white">
            People <span className="text-violet-400">OS</span>
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Agendamento inteligente{" "}
            <span className="text-violet-400">sem fricção</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Compartilhe seu link, deixe as pessoas escolherem o horário.
            Sem trocas de e-mail, sem conflitos, sem double-booking.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-xl bg-violet-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 active:scale-[0.99]"
          >
            Começar agora — é grátis
          </Link>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto rounded-xl border border-zinc-700 px-8 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-white"
          >
            Como funciona
          </a>
        </div>

        {/* Social proof mínimo */}
        <p className="text-xs text-zinc-600">
          Sem cartão de crédito · Setup em 2 minutos
        </p>
      </div>

      {/* Seção como funciona */}
      <div id="como-funciona" className="mt-32 w-full max-w-3xl mx-auto px-4">
        <h2 className="text-center text-xl font-semibold text-white mb-12">
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Configure sua agenda",
              description:
                "Defina seus dias e horários disponíveis, tipos de reunião e duração.",
            },
            {
              step: "02",
              title: "Compartilhe seu link",
              description:
                "Envie seu link personalizado para clientes, parceiros ou equipe.",
            },
            {
              step: "03",
              title: "Reuniões confirmadas",
              description:
                "As pessoas escolhem o horário e você recebe a confirmação automática.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3"
            >
              <span className="text-xs font-mono font-medium text-violet-400">
                {item.step}
              </span>
              <h3 className="text-sm font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-violet-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500"
          >
            Criar minha conta
          </Link>
        </div>
      </div>

      <footer className="mt-24 pb-8 text-center text-xs text-zinc-700">
        © {new Date().getFullYear()} People OS · Todos os direitos reservados
      </footer>
    </main>
  )
}