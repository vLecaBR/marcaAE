"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { availabilitySchema, type AvailabilityInput } from "@/lib/validators/onboarding"
import { saveAvailabilityAction } from "@/lib/actions/availability"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

const DEFAULT_DAYS = [
  { dayOfWeek: 0, enabled: false, intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 1, enabled: true,  intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 2, enabled: true,  intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 3, enabled: true,  intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 4, enabled: true,  intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 5, enabled: true,  intervals: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 6, enabled: false, intervals: [{ startTime: "09:00", endTime: "18:00" }] },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0")
  const m = i % 2 === 0 ? "00" : "30"
  return `${h}:${m}`
})

interface AvailabilityFormProps {
  schedule: {
    id: string
    timeZone: string
    availabilities: { dayOfWeek: number; startTime: string; endTime: string }[]
  }
}

export function AvailabilityForm({ schedule }: AvailabilityFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Monta os dias agrupando intervalos
  const initialDays = DEFAULT_DAYS.map((def) => {
    const existing = schedule.availabilities
      .filter((a) => a.dayOfWeek === def.dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    if (existing.length > 0) {
      return {
        dayOfWeek: def.dayOfWeek,
        enabled: true,
        intervals: existing.map(e => ({ startTime: e.startTime, endTime: e.endTime }))
      }
    }
    return def
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityInput>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      scheduleId: schedule.id,
      timeZone: schedule.timeZone || "America/Sao_Paulo",
      availabilities: initialDays,
    },
  })

  const watchedDays = watch("availabilities")

  async function onSubmit(data: AvailabilityInput) {
    setServerError(null)
    setSuccessMsg(null)
    const result = await saveAvailabilityAction(data)
    if (result.success) {
      setSuccessMsg("Disponibilidade salva com sucesso!")
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setServerError(result.error)
    }
  }

  function addInterval(dayIndex: number) {
    const currentIntervals = watchedDays[dayIndex].intervals
    
    // Simplificando pra adicionar um bloco na tarde
    const newStart = "13:00"
    const newEnd = "18:00"

    setValue(`availabilities.${dayIndex}.intervals`, [
      ...currentIntervals,
      { startTime: newStart, endTime: newEnd }
    ])
  }

  function removeInterval(dayIndex: number, intervalIndex: number) {
    const currentIntervals = watchedDays[dayIndex].intervals
    if (currentIntervals.length <= 1) {
      // Se apagar o último, desativa o dia
      setValue(`availabilities.${dayIndex}.enabled`, false)
      return
    }
    
    setValue(
      `availabilities.${dayIndex}.intervals`,
      currentIntervals.filter((_, i) => i !== intervalIndex)
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {serverError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{serverError}</p>
        </div>
      )}
      
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{successMsg}</p>
        </div>
      )}

      {/* Lista de dias */}
      <div className="space-y-3">
        {DEFAULT_DAYS.map((_, index) => {
          const isEnabled = watchedDays[index]?.enabled
          const intervals = watchedDays[index]?.intervals || []
          const hasError = errors.availabilities?.[index]?.intervals

          return (
            <div
              key={index}
              className={cn(
                "flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border p-4 sm:p-5 transition-all",
                isEnabled
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-zinc-800/50 bg-zinc-900/10 opacity-60"
              )}
            >
              {/* Header do Dia (Toggle + Nome) */}
              <div className="flex w-full sm:w-40 items-center gap-3 shrink-0 sm:pt-1">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register(`availabilities.${index}.enabled`)}
                  />
                  <div className={cn(
                    "h-5 w-9 rounded-full border transition-all",
                    "peer-checked:bg-violet-600 peer-checked:border-violet-600",
                    "bg-zinc-800 border-zinc-700",
                    "after:absolute after:top-[2px] after:left-[2px]",
                    "after:h-4 after:w-4 after:rounded-full after:bg-white",
                    "after:transition-all peer-checked:after:translate-x-full"
                  )} />
                </label>
                <span className={cn(
                  "text-sm font-medium",
                  isEnabled ? "text-white" : "text-zinc-500"
                )}>
                  {DAY_LABELS[index]}
                </span>
              </div>

              {/* Intervalos */}
              <div className="flex-1 space-y-3">
                {isEnabled ? (
                  <>
                    {intervals.map((interval, iIndex) => (
                      <div key={iIndex} className="flex flex-wrap items-center gap-2">
                        <select
                          {...register(`availabilities.${index}.intervals.${iIndex}.startTime`)}
                          className="w-24 sm:w-28 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-colors"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-zinc-500 text-sm px-1">-</span>
                        <select
                          {...register(`availabilities.${index}.intervals.${iIndex}.endTime`)}
                          className="w-24 sm:w-28 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-colors"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        
                        <button
                          type="button"
                          onClick={() => removeInterval(index, iIndex)}
                          className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                          title="Remover intervalo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addInterval(index)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors mt-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar intervalo
                    </button>

                    {hasError && (
                      <p className="text-xs text-rose-400 mt-2">
                        {hasError.message || "Intervalo inválido ou sobreposto."}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-zinc-600 sm:pt-1 block">Indisponível neste dia</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full sm:w-auto rounded-xl bg-violet-600 px-8 py-3 text-sm font-medium text-white",
            "transition-all hover:bg-violet-500 active:scale-[0.99]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  )
}
