import { Crown, Shield, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeamRoleName } from "@/lib/api/types"

const ROLE_META: Record<TeamRoleName, { label: string; icon: typeof User; className: string }> = {
  OWNER: { label: "Proprietário", icon: Crown, className: "bg-brand-primary/10 text-brand-primary" },
  ADMIN: { label: "Administrador", icon: Shield, className: "bg-brand-secondary/10 text-brand-secondary" },
  MEMBER: { label: "Membro", icon: User, className: "bg-muted text-muted-foreground" },
}

export function roleLabel(role: TeamRoleName): string {
  return ROLE_META[role]?.label ?? role
}

/** Selo de papel na paleta Healthtech (Teal owner · azul admin · neutro membro). */
export function RoleBadge({ role, className }: { role: TeamRoleName; className?: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.MEMBER
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  )
}
