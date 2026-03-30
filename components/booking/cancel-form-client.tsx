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
      <p className="text-sm text-zinc-400">
        Olá, <span className="text-white">{guestName}</span>. Tem certeza que
        deseja cancelar este agendamento?
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">
          Motivo do cancelamento
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Compromisso imprevisto, preciso reagendar..."
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>

      <div className="flex gap-3">
            <a
          href={`/booking/${uid}`}
          className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-center text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-white"
        >
          Voltar
        </a>
        <button
          onClick={handleCancel}
          disabled={loading}
          className={cn(
            "flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white",
            "transition-all hover:bg-rose-500 active:scale-[0.99]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {loading ? "Cancelando..." : "Confirmar cancelamento"}
        </button>
      </div>
    </div>
  )
}