import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { requireUser } from "@/lib/auth/guards"

export const metadata: Metadata = { title: "Configuração inicial" }

/**
 * Onboarding do profissional. Guarda: exige sessão; se já concluído, vai para o dashboard.
 * Valores iniciais vêm do `MeDto` (username/fuso); o resto é preenchido no wizard.
 */
export default async function OnboardingPage() {
  const user = await requireUser()
  if (user.onboarded) redirect("/dashboard")

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-center p-6">
        <Logo />
      </header>
      <div className="flex flex-1 items-start justify-center px-6 pt-4 pb-16">
        <OnboardingWizard
          defaultUsername={user.username ?? ""}
          defaultTimeZone={user.timeZone ?? "America/Sao_Paulo"}
        />
      </div>
    </div>
  )
}
