"use client"

import { useState } from "react"
import { Calendar, Trash2, Plus, CalendarOff, Palmtree } from "lucide-react"
import { addExceptionAction, removeExceptionAction } from "@/lib/actions/exceptions"
import { cn } from "@/lib/utils"

export function ExceptionsManager({ 
  scheduleId, 
  exceptions 
}: { 
  scheduleId: string, 
  exceptions: any[] 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState("")
  const [type, setType] = useState<"BLOCKED" | "VACATION">("BLOCKED")
  const [reason, setReason] = useState("")

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setError(null)
    setLoading(true)

    const result = await addExceptionAction({ scheduleId, date, type, reason })

    if (result.success) {
      setDate("")
      setReason("")
      setType("BLOCKED")
    } else {
      setError(result.error ?? "Erro ao adicionar bloqueio.")
    }
    setLoading(false)
  }

  async function handleRemove(id: string) {
    if (!confirm("Tem certeza que deseja remover este bloqueio?")) return
    
    setLoading(true)
    const result = await removeExceptionAction(id)
    if (!result.success) {
      alert(result.error ?? "Erro ao remover bloqueio.")
    }
    setLoading(false)
  }

  // Ordenar por data crescente
  const sortedExceptions = [...exceptions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const upcomingExceptions = sortedExceptions.filter(
    (ex) => new Date(ex.date).getTime() >= new Date().setHours(0, 0, 0, 0)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        
        {/* Formulário (Esquerda) */}
        <form onSubmit={handleAdd} className="w-full sm:w-1/3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-white">Novo Bloqueio</h3>
          <p className="text-xs text-zinc-400">
            Adicione datas em que você não poderá atender (Feriados, Férias, etc). O dia inteiro será bloqueado.
          </p>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                style={{ colorScheme: "dark" }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Tipo</label>
              <div className="flex rounded-xl bg-zinc-950 border border-zinc-800 p-1">
                <button
                  type="button"
                  onClick={() => setType("BLOCKED")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                    type === "BLOCKED" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <CalendarOff className="h-3 w-3" /> Folga
                </button>
                <button
                  type="button"
                  onClick={() => setType("VACATION")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                    type === "VACATION" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Palmtree className="h-3 w-3" /> Férias
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Feriado Nacional, Viagem..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !date}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="h-4 w-4" />
            Adicionar Bloqueio
          </button>
        </form>

        {/* Lista (Direita) */}
        <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
          <div className="border-b border-zinc-800 px-5 py-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            <h3 className="font-semibold text-white">Bloqueios Futuros</h3>
          </div>
          
          {upcomingExceptions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <CalendarOff className="h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm font-medium text-zinc-400">Nenhum bloqueio cadastrado</p>
              <p className="text-xs text-zinc-500 mt-1">Sua agenda está disponível nos dias configurados.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50 overflow-y-auto max-h-[350px]">
              {upcomingExceptions.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase">
                        {new Date(ex.date).toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {new Date(ex.date).getUTCDate()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {new Date(ex.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                        </p>
                        <span className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          ex.type === "VACATION" ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {ex.type === "VACATION" ? "Férias" : "Folga"}
                        </span>
                      </div>
                      {ex.reason && (
                        <p className="text-xs text-zinc-500 mt-0.5">{ex.reason}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(ex.id)}
                    disabled={loading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
