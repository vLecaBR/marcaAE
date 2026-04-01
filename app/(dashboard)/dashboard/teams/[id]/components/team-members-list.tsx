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
      case "OWNER": return <Star className="h-4 w-4 text-amber-400" />
      case "ADMIN": return <Shield className="h-4 w-4 text-violet-400" />
      default: return <User className="h-4 w-4 text-zinc-400" />
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="border-b border-zinc-800 px-6 py-5">
        <h3 className="text-base font-semibold text-white">Membros da Equipe</h3>
        <p className="mt-1 text-sm text-zinc-400">Pessoas que podem acessar e gerenciar esta equipe.</p>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800 ring-2 ring-zinc-800/50">
                {member.user.image ? (
                  <img src={member.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
                    {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {member.user.name || "Usuário sem nome"}
                  {member.userId === currentUserId && <span className="ml-2 text-xs text-zinc-500">(Você)</span>}
                </p>
                <p className="text-xs text-zinc-400">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {getRoleIcon(member.role)}
                {getRoleLabel(member.role)}
              </div>

              {canInvite && member.userId !== currentUserId && member.role !== "OWNER" && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
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
        <div className="border-t border-zinc-800 bg-zinc-950/50 px-6 py-5 rounded-b-2xl">
          <h4 className="text-sm font-medium text-white mb-4">Convidar novo membro</h4>
          
          <form onSubmit={handleInvite} className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail do profissional..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
            
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-violet-500 transition-all"
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Administrador</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Convidar
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">O profissional já deve ter uma conta na plataforma com este e-mail.</p>
        </div>
      )}
    </div>
  )
}
