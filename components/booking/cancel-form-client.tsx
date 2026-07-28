// components/booking/cancel-form-client.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CancelFormClientProps {
  uid: string
  guestName: string
}

export function CancelFormClient({ uid, guestName }: CancelFormClientProps) {
  const router = useRouter()
  const [reason, setReason]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleCancel() {
    if (!reason.trim()) {
      setError("Por favor, informe o motivo do cancelamento.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/book/${uid}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, canceledBy: "GUEST" }),
      })

      if (res.ok) {
        router.push(`/booking/${uid}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? "Erro ao cancelar. Tente novamente.")
        setLoading(false)
      }
    } catch {
      setError("Erro de conexão. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Olá, <span className="text-foreground">{guestName}</span>. Tem certeza que
        deseja cancelar este agendamento?
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Motivo do cancelamento
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Compromisso imprevisto, preciso reagendar..."
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-destructive focus:ring-1 focus:ring-destructive"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex gap-3">
            <a
          href={`/booking/${uid}`}
          className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-medium text-foreground transition-all hover:border-border hover:text-foreground"
        >
          Voltar
        </a>
        <button
          onClick={handleCancel}
          disabled={loading}
          className={cn(
            "flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground",
            "transition-all hover:bg-destructive/90 active:scale-[0.99]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {loading ? "Cancelando..." : "Confirmar cancelamento"}
        </button>
      </div>
    </div>
  )
}