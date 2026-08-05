"use client"

/**
 * Formulário de login Healthtech. NextAuth removido — magic link vai pelo BFF
 * (`POST /api/auth/magic-link`) e o Google navega direto para o `/auth/google/start` da API.
 */

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useState } from "react"
import { m } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Mail, CheckCircle2, Loader2 } from "lucide-react"
import { savePlanIntentAll, isValidPaidPlan } from "@/lib/billing/plan-intent"

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
})
type FormValues = z.infer<typeof schema>

/** URL do início do OAuth Google na API .NET (navegação de página inteira). */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080"
const GOOGLE_START_URL = `${API}/api/v1/auth/google/start`

export function LoginForm() {
  const [sent, setSent] = useState<string | null>(null)
  // Bug 1: leva o plano retido para dentro do fluxo OAuth (`?plan=`) — o backend o ecoa no state e
  // no redirect final, e o cookie same-site garante a intenção mesmo se o localStorage se perder.
  const [googleUrl, setGoogleUrl] = useState(GOOGLE_START_URL)

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan")
    if (isValidPaidPlan(plan)) {
      setGoogleUrl(`${GOOGLE_START_URL}?plan=${encodeURIComponent(plan)}`)
    }
  }, [])

  /** Persiste a intenção (cookie + localStorage) imediatamente antes de sair para o Google. */
  function handleGoogleClick() {
    const plan = new URLSearchParams(window.location.search).get("plan")
    savePlanIntentAll(plan)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormValues) {
    // Resposta é sempre genérica (não revela existência do e-mail); mostramos o estado "enviado".
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "same-origin",
    }).catch(() => null)
    setSent(email)
  }

  if (sent) {
    return (
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-care/30 bg-care/10 p-6 text-center"
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-care" />
        <h2 className="mt-3 text-base font-semibold">Verifique seu e-mail</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enviamos um link de acesso para <span className="font-medium text-foreground">{sent}</span>.
          Abra-o neste dispositivo para entrar.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-4 text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          Usar outro e-mail
        </button>
      </m.div>
    )
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="outline" className="h-11 w-full gap-2.5 rounded-xl">
        <a href={googleUrl} onClick={handleGoogleClick}>
          <GoogleIcon /> Continuar com Google
        </a>
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            E-mail profissional
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@clinica.com"
            aria-invalid={!!errors.email}
            className="mt-1.5 h-11 rounded-xl"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-xl">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Mail size={16} /> Enviar link de acesso
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.27-4.74 3.27-8.33z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
