"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"
import type { Slot } from "@/lib/scheduling/types"
import { cn } from "@/lib/utils"

const bookingFormSchema = z.object({
  name:  z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().optional(),
  notes: z.string().max(500).optional(),
  responses: z.record(z.string(), z.string()).optional(),
  recurringCount: z.number().int().min(1).max(52).optional(),
})

type BookingFormInput = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  slot: Slot
  eventType: {
    id: string; title: string; duration: number
    locationType: string; requiresConfirm: boolean
    questions?: any[]
  }
  owner: { id: string; name: string | null }
  viewerTimeZone: string
  onBack: () => void
}

type BookingResult =
  | { status: "success"; requiresConfirm: boolean; pixData?: any }
  | { status: "conflict" }
  | { status: "error"; message: string }

export function BookingForm({
  slot,
  eventType,
  owner,
  viewerTimeZone,
  onBack,
}: BookingFormProps) {
  const [result, setResult] = useState<BookingResult | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
  })

  const timeLabel = formatInTimeZone(slot.startUtc, viewerTimeZone, "HH:mm")
  const dateLabel = format(
    new Date(
      formatInTimeZone(slot.startUtc, viewerTimeZone, "yyyy-MM-dd") + "T12:00:00"
    ),
    "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  )

  async function onSubmit(data: BookingFormInput) {
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventTypeId:   eventType.id,
        ownerId:       owner.id,
        startTimeUtc:  new Date(slot.startUtc).toISOString(),
        endTimeUtc:    new Date(slot.endUtc).toISOString(),
        guestTimeZone: viewerTimeZone,
        guestName:     data.name,
        guestEmail:    data.email,
        guestPhone:    data.phone,
        guestNotes:    data.notes,
        responses:     data.responses ? Object.entries(data.responses).map(([questionId, answer]) => ({ questionId, answer })) : [],
        recurringCount: data.recurringCount ?? 1,
      }),
    })

    const json = await res.json()

    if (res.status === 409) {
      setResult({ status: "conflict" })
    } else if (!res.ok) {
      setResult({ status: "error", message: json.error ?? "Erro ao agendar." })
    } else {
      setResult({
        status: "success",
        requiresConfirm: eventType.requiresConfirm,
      })
    }
  }

  // Tela de sucesso
  if (result?.status === "success") {
    if (result.pixData) {
      return (
        <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10">
            <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Pagamento via Pix</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm">
            Escaneie o QR Code abaixo no app do seu banco para confirmar o agendamento.
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4">
            <img 
              src={`data:image/png;base64,${result.pixData.qrCodeBase64}`} 
              alt="QR Code Pix" 
              className="w-48 h-48"
            />
          </div>

          <div className="mt-6 w-full max-w-sm space-y-2 text-left">
            <p className="text-xs font-medium text-zinc-400">Pix Copia e Cola:</p>
            <div className="relative">
              <input
                readOnly
                value={result.pixData.qrCode}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-12 text-xs text-zinc-300 outline-none"
              />
              <button 
                onClick={() => navigator.clipboard.writeText(result.pixData.qrCode)}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Copiar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            {result.requiresConfirm && (
              <p className="text-xs text-amber-400 mt-4 text-center">
                Após o pagamento, o agendamento irá para aprovação manual.
              </p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">
          {result.requiresConfirm ? "Solicitação enviada!" : "Agendamento confirmado!"}
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-sm">
          {result.requiresConfirm
            ? `${owner.name} receberá sua solicitação e confirmará em breve.`
            : "Você receberá um e-mail de confirmação com os detalhes."}
        </p>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-left space-y-1">
          <p className="text-sm font-medium text-white">{eventType.title}</p>
          <p className="text-xs capitalize text-zinc-400">{dateLabel}</p>
          <p className="text-xs text-zinc-400">{timeLabel} · {eventType.duration} min</p>
        </div>
      </div>
    )
  }

  // Tela de conflito
  if (result?.status === "conflict") {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">
          Horário indisponível
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-sm">
          Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.
        </p>
        <button
          onClick={onBack}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          Escolher outro horário
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr]">
      {/* Resumo lateral */}
      <div className="border-b border-zinc-800 p-6 lg:border-b-0 lg:border-r">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </button>

        <h3 className="text-sm font-medium text-white mb-4">
          Resumo do agendamento
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-zinc-600 mb-0.5">Evento</p>
            <p className="text-zinc-300">{eventType.title}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-0.5">Data</p>
            <p className="capitalize text-zinc-300">{dateLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-0.5">Horário</p>
            <p className="text-zinc-300">
              {timeLabel} · {eventType.duration} min
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-0.5">Fuso horário</p>
            <p className="text-zinc-300">{viewerTimeZone}</p>
          </div>
          {eventType.requiresConfirm && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <p className="text-xs text-amber-400">
                Este evento requer confirmação manual do organizador.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        <h3 className="text-sm font-medium text-white">
          Seus dados
        </h3>

        {result?.status === "error" && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className="text-sm text-rose-400">{result.message}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Nome completo</label>
          <input
            {...register("name")}
            placeholder="Seu nome"
            className={inputClass}
          />
          {errors.name && (
            <p className="text-xs text-rose-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">E-mail</label>
          <input
            {...register("email")}
            type="email"
            placeholder="seu@email.com"
            className={inputClass}
          />
          {errors.email && (
            <p className="text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Telefone{" "}
            <span className="text-zinc-600 font-normal">(opcional)</span>
          </label>
          <input
            {...register("phone")}
            placeholder="+55 (11) 99999-9999"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Notas{" "}
            <span className="text-zinc-600 font-normal">(opcional)</span>
          </label>
          <textarea
            {...register("notes")}
            placeholder="Alguma informação adicional para o organizador..."
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {eventType.questions && eventType.questions.length > 0 && (
          <div className="space-y-5 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-white">Perguntas adicionais</h3>
            {eventType.questions.map((q: any) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  {q.label}{" "}
                  {!q.required && <span className="text-zinc-600 font-normal">(opcional)</span>}
                </label>
                
                {q.type === "TEXTAREA" ? (
                  <textarea
                    {...register(`responses.${q.id}` as any, { required: q.required ? "Campo obrigatório" : false })}
                    placeholder={q.placeholder ?? ""}
                    rows={3}
                    className={cn(inputClass, "resize-none")}
                  />
                ) : (
                  <input
                    {...register(`responses.${q.id}` as any, { required: q.required ? "Campo obrigatório" : false })}
                    type={q.type === "PHONE" ? "tel" : "text"}
                    placeholder={q.placeholder ?? ""}
                    className={inputClass}
                  />
                )}
                {errors.responses?.[q.id] && (
                  <p className="text-xs text-rose-400">{(errors.responses[q.id] as any).message}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white",
            "transition-all hover:bg-violet-500 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isSubmitting
            ? "Agendando..."
            : eventType.requiresConfirm
            ? "Solicitar agendamento"
            : "Confirmar agendamento"}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"