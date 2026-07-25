"use client"

/**
 * Botão de logout — chama o endpoint do BFF (`/api/auth/logout`) que encerra a sessão na
 * API .NET e limpa os cookies. Substitui o `signOut()` do NextAuth.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    } finally {
      startTransition(() => {
        router.replace("/login")
        router.refresh()
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading || pending}
      className={
        className ??
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
      }
    >
      <LogOut className="h-4 w-4" />
      <span>{loading || pending ? "Saindo…" : "Sair"}</span>
    </button>
  )
}
