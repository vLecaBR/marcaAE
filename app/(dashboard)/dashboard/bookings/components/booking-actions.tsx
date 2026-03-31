"use client"

import { useState } from "react"
import { approveBookingAction, rejectBookingAction } from "../actions"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

export function BookingActions({ uid, status }: { uid: string, status: string }) {
  const [loading, setLoading] = useState(false)

  if (status !== "PENDING") return null

  async function handleApprove() {
    setLoading(true)
    await approveBookingAction(uid)
    setLoading(false)
  }

  async function handleReject() {
    const reason = prompt("Motivo da recusa (opcional):") ?? "Recusado pelo profissional."
    setLoading(true)
    await rejectBookingAction(uid, reason)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" />
        Recusar
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprovar
      </button>
    </div>
  )
}
