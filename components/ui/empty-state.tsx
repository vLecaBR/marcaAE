/**
 * Empty state global reutilizável (Fase 7 · spec §7.2).
 *
 * Design minimalista na paleta Teal: ícone claro em círculo `bg-brand-primary/10`, título, copy de
 * apoio acolhedora e um slot de CTA opcional. É intencionalmente "server-safe" (sem `"use client"`,
 * sem handlers): o CTA entra pelo slot `action`, onde o chamador passa o que fizer sentido — um
 * `<Link>`/`<Button asChild>` (RSC) ou um `<Button onClick>` dentro de um client component.
 *
 * Uso:
 *   <EmptyState
 *     icon={CalendarX2}
 *     title="Nenhum agendamento por aqui"
 *     description="Quando um paciente marcar uma consulta, ela aparece nesta lista."
 *     action={<Button asChild><Link href="/dashboard/event-types">Criar primeira consulta</Link></Button>}
 *   />
 */

import type { ComponentType, ReactNode, SVGProps } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  /** Ícone lucide-react (ex.: `CalendarX2`). Renderizado dentro do círculo Teal. */
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  /** Copy de apoio: tom acolhedor, sem jargão, orientada à ação (spec §7.2/§7.5). */
  description?: string
  /** CTA opcional — passe um `<Button>`/`<Link>` já estilizado. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary"
      >
        <Icon className="h-7 w-7" />
      </span>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
