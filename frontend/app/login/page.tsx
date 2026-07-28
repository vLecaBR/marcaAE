import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { LoginForm } from "@/components/auth/login-form"
import { ShieldCheck } from "lucide-react"

export const metadata: Metadata = { title: "Entrar" }

/**
 * Login Healthtech: superfície calma e limpa (paleta Teal, muito espaço em branco).
 * A lógica de autenticação vive no client (`LoginForm`) sobre o BFF — sem NextAuth.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border-border/60 p-8 shadow-sm sm:p-10">
            <div className="mb-7 flex justify-center">
              <Logo />
            </div>
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              Acesse sua conta
            </h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              Gerencie sua agenda e recebimentos com tranquilidade.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </Card>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck size={13} className="text-care" />
            Seus dados são protegidos. Ao continuar, você concorda com os{" "}
            <a href="/termos" className="underline underline-offset-2">Termos</a> e a{" "}
            <a href="/privacidade" className="underline underline-offset-2">Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
