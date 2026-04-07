"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatInTimeZone } from "date-fns-tz"
import type { Slot } from "@/lib/scheduling/types"
import { cn } from "@/lib/utils"

interface TimeSlotPickerProps {
  slots: Slot[]
  selectedDate: string | null
  viewerTimeZone: string
  duration: number
  onSelectSlot: (slot: Slot) => void
  eventTypeId: string
  ownerId: string
}

export function TimeSlotPicker({
  slots,
  selectedDate,
  viewerTimeZone,
  duration,
  onSelectSlot,
  eventTypeId,
  ownerId,
}: TimeSlotPickerProps) {
  const [realSlots, setRealSlots] = useState<Slot[]>(slots)
  const [loading, setLoading]     = useState(false)

  // Re-busca slots reais do servidor quando uma data é selecionada
  // para garantir que agendamentos recentes sejam refletidos
  useEffect(() => {
    if (!selectedDate) return

    let cancelled = false
    setLoading(true)

    fetch(
      `/api/slots?ownerId=${ownerId}&eventTypeId=${eventTypeId}&date=${selectedDate}&tz=${encodeURIComponent(viewerTimeZone)}`
    )
      .then((r) => r.json())
      .then((data: { slots?: Slot[] }) => {
        if (!cancelled && data.slots) {
          setRealSlots(data.slots)
        }
      })
      .catch(() => {
        if (!cancelled) setRealSlots(slots)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedDate, ownerId, eventTypeId, viewerTimeZone, slots])

  const dateLabel = format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1 text-sm font-medium capitalize text-white">
        {dateLabel}
      </p>
      <p className="mb-5 text-xs text-zinc-600">
        {duration} min · {viewerTimeZone}
      </p>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />
        </div>
      ) : realSlots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-zinc-600">
            Nenhum horário disponível neste dia.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-105">
          {realSlots.map((slot, idx) => {
            const timeLabel = formatInTimeZone(
              slot.startUtc,
              viewerTimeZone,
              "HH:mm"
            )
            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3",
                  "text-left text-sm font-medium text-white transition-all",
                  "hover:border-violet-500/60 hover:bg-violet-600/10 hover:text-violet-300"
                )}
              >
                {timeLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}