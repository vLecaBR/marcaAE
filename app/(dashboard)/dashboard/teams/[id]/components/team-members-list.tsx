"use client"

import { useState } from "react"
import { inviteTeamMemberAction, removeTeamMemberAction } from "@/lib/actions/team"
import { UserPlus, Shield, User, Star, Trash2 } from "lucide-react"

type MemberData = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

interface Props {
  teamId: string
  members: MemberData[]
  currentUserRole: string
  currentUserId: string
}

export function TeamMembersList({ teamId, members, currentUserRole, currentUserId }: Props) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN"

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)

    const res = await inviteTeamMemberAction({ teamId, email, role: role as "ADMIN" | "MEMBER" })

    if (res.success) {
      setEmail("")
    } else {
      setError(res.error)
    }

    setLoading(false)
  }

  async function handleRemove(targetUserId: string) {
    if (!confirm("Tem certeza que deseja remover este membro?")) return

    const res = await removeTeamMemberAction(teamId, targetUserId)
    if (!res.success) {
      alert(res.error)
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "OWNER": return <Star className="h-4 w-4 text-warning" />
      case "ADMIN": return <Shield className="h-4 w-4 text-brand-secondary" />
      default: return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "OWNER": return "Proprietário"
      case "ADMIN": return "Administrador"
      default: return "Membro"
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">Membros da clínica</h3>
        <p className="mt-1 text-sm text-muted-foreground">Profissionais que podem acessar e gerenciar esta clínica.</p>
      </div>

      <div className="divide-y divide-border/60">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-border/50">
                {member.user.image ? (
                  <img src={member.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-brand-primary">
                    {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {member.user.name || "Usuário sem nome"}
                  {member.userId === currentUserId && <span className="ml-2 text-xs text-muted-foreground">(Você)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                {getRoleIcon(member.role)}
                {getRoleLabel(member.role)}
              </div>

              {canInvite && member.userId !== currentUserId && member.role !== "OWNER" && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Remover membro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canInvite && (
        <div className="border-t border-border/60 bg-surface px-6 py-5 rounded-b-2xl">
          <h4 className="text-sm font-medium text-foreground mb-4">Convidar novo profissional</h4>

          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail do profissional..."
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <select
              value={role}
              aria-label="Papel do profissional"
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none focus:border-brand-primary transition-all"
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Administrador</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-medium text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Convidar
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">O profissional já deve ter uma conta na plataforma com este e-mail.</p>
        </div>
      )}
    </div>
  )
}
