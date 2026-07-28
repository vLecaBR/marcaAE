"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { eventTypeSchema, type EventTypeInput } from "@/lib/validators/event-type"
import { upsertEventTypeAction } from "@/lib/actions/event-types"
import { cn } from "@/lib/utils"

const COLORS: { value: EventTypeInput["color"]; class: string }[] = [
  { value: "TEAL",    class: "bg-teal-500" },
  { value: "EMERALD", class: "bg-emerald-500" },
  { value: "CYAN",    class: "bg-cyan-500" },
  { value: "AMBER",   class: "bg-amber-500" },
  { value: "ORANGE",  class: "bg-orange-500" },
  { value: "ROSE",    class: "bg-rose-500" },
  { value: "SLATE",   class: "bg-slate-500" },
]

const DURATIONS = [15, 20, 30, 45, 60, 90, 120]

const LOCATION_OPTIONS: { value: EventTypeInput["locationType"]; label: string }[] = [
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "ZOOM",        label: "Zoom" },
  { value: "TEAMS",       label: "Microsoft Teams" },
  { value: "PHONE",       label: "Telefone" },
  { value: "IN_PERSON",   label: "Presencial" },
  { value: "CUSTOM",      label: "Link personalizado" },
]

interface EventTypeFormProps {
  open: boolean
  onClose: () => void
  defaultValues?: Partial<EventTypeInput> & { id?: string }
  userTeams?: { id: string, name: string }[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function EventTypeForm({ open, onClose, defaultValues, userTeams = [] }: EventTypeFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!defaultValues?.id

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof eventTypeSchema>, any, EventTypeInput>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      duration: 30,
      color: "TEAL",
      isActive: true,
      requiresConfirm: false,
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
      bookingLimitDays: 60,
      locationType: "GOOGLE_MEET",
      locationValue: "",
      price: null,
      questions: [],
      ...defaultValues,
    },
  })

  const titleValue = watch("title")
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions"
  })
  const colorValue = watch("color")
  const locationTypeValue = watch("locationType")

  // Auto-gera slug a partir do título (apenas na criação)
  useEffect(() => {
    if (!isEditing) {
      setValue("slug", slugify(titleValue ?? ""), { shouldValidate: false })
    }
  }, [titleValue, isEditing, setValue])

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        slug: "",
        description: "",
        duration: 30,
        color: "TEAL",
        isActive: true,
        requiresConfirm: false,
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        bookingLimitDays: 60,
        locationType: "GOOGLE_MEET",
        locationValue: "",
        price: null,
        questions: [],
        ...defaultValues,
      })
      setServerError(null)
    }
  }, [open, defaultValues, reset])

  async function onSubmit(data: EventTypeInput) {
    setServerError(null)
    const payload = defaultValues?.id
      ? { ...data, id: defaultValues.id }
      : data

    const result = await upsertEventTypeAction(payload)

    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setServerError(result.error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Editar tipo de consulta" : "Novo tipo de consulta"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Título */}
          <Field label="Título" error={errors.title?.message}>
            <input
              {...register("title")}
              placeholder="Ex: Consulta de retorno"
              className={inputClass}
            />
          </Field>

          {/* Slug */}
          <Field label="Slug (URL)" error={errors.slug?.message}>
            <input
              {...register("slug")}
              placeholder="consulta-retorno"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Aparece na URL pública do agendamento
            </p>
          </Field>

          {/* Descrição */}
          <Field label="Descrição" error={errors.description?.message}>
            <textarea
              {...register("description")}
              placeholder="Descreva o propósito desta consulta..."
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          {/* Duração */}
          <Field label="Duração" error={errors.duration?.message}>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue("duration", d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    watch("duration") === d
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-border bg-transparent text-muted-foreground hover:border-brand-primary/40 hover:text-foreground"
                  )}
                >
                  {d} min
                </button>
              ))}
              <input
                {...register("duration", { valueAsNumber: true })}
                type="number"
                placeholder="outro"
                className={cn(inputClass, "w-20 py-1.5")}
              />
            </div>
          </Field>

          {/* Cor */}
          <Field label="Cor" error={errors.color?.message}>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={`Cor ${c.value}`}
                  onClick={() => setValue("color", c.value)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all ring-offset-card",
                    c.class,
                    colorValue === c.value
                      ? "ring-2 ring-brand-primary ring-offset-2"
                      : "opacity-50 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </Field>

          {/* Localização */}
          <Field label="Localização" error={errors.locationType?.message}>
            <select
              {...register("locationType")}
              className={cn(inputClass, "appearance-none")}
            >
              {LOCATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {(locationTypeValue === "CUSTOM" ||
            locationTypeValue === "IN_PERSON" ||
            locationTypeValue === "PHONE") && (
            <Field label="Detalhes da localização" error={errors.locationValue?.message}>
              <input
                {...register("locationValue")}
                placeholder={
                  locationTypeValue === "PHONE"
                    ? "+55 (11) 99999-9999"
                    : locationTypeValue === "IN_PERSON"
                    ? "Endereço completo"
                    : "https://..."
                }
                className={inputClass}
              />
            </Field>
          )}

          {/* Buffers */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Buffer antes (min)" error={errors.beforeEventBuffer?.message}>
              <input
                {...register("beforeEventBuffer", { valueAsNumber: true })}
                type="number"
                min={0}
                max={60}
                className={inputClass}
              />
            </Field>
            <Field label="Buffer depois (min)" error={errors.afterEventBuffer?.message}>
              <input
                {...register("afterEventBuffer", { valueAsNumber: true })}
                type="number"
                min={0}
                max={60}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Preço */}
          <Field label="Preço (Opcional)" error={errors.price?.message}>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input
                {...register("price", {
                  setValueAs: (v) => {
                    if (v === "" || v === null || isNaN(v)) return null;
                    return parseFloat(v) * 100; // Salva em centavos
                  }
                })}
                defaultValue={defaultValues?.price ? (defaultValues.price / 100).toFixed(2) : ""}
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                className={cn(inputClass, "pl-9")}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Deixe em branco para consultas gratuitas.
            </p>
          </Field>

          {/* Limite de dias */}
          <Field label="Agendamentos até (dias)" error={errors.bookingLimitDays?.message}>
            <input
              {...register("bookingLimitDays", { valueAsNumber: true })}
              type="number"
              min={1}
              max={365}
              placeholder="60"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Quantos dias à frente os pacientes podem agendar
            </p>
          </Field>

            {/* Flags */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-surface p-4">
            <Toggle
              label="Requer confirmação manual"
              description="Você precisa aprovar cada agendamento antes de confirmar."
              checked={watch("requiresConfirm") ?? false}
              onChange={(v) => setValue("requiresConfirm", v)}
            />
          </div>

          {userTeams && userTeams.length > 0 && (
            <Field label="Equipe" error={errors.teamId?.message}>
              <select
                {...register("teamId")}
                className={cn(inputClass, "appearance-none")}
              >
                <option value="">Pessoal (Apenas minha agenda)</option>
                {userTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Se selecionado, esta consulta será exibida na página da clínica.
              </p>
            </Field>
          )}

          {/* Perguntas Customizadas */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Perguntas adicionais</h3>
                <p className="text-xs text-muted-foreground">Faça perguntas aos pacientes antes de agendar.</p>
              </div>
              <button
                type="button"
                onClick={() => appendQuestion({ label: "", type: "TEXT", required: false, order: questionFields.length })}
                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                + Adicionar
              </button>
            </div>

            {questionFields.length > 0 && (
              <div className="space-y-3">
                {questionFields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border border-border/60 bg-surface p-4 relative group">
                    <button
                      type="button"
                      aria-label="Remover pergunta"
                      onClick={() => removeQuestion(index)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="grid gap-3">
                      <Field label="Pergunta" error={errors.questions?.[index]?.label?.message}>
                        <input
                          {...register(`questions.${index}.label` as const)}
                          placeholder="Ex: Qual o motivo da consulta?"
                          className={inputClass}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Tipo de resposta">
                          <select
                            {...register(`questions.${index}.type` as const)}
                            className={cn(inputClass, "appearance-none")}
                          >
                            <option value="TEXT">Texto Curto</option>
                            <option value="TEXTAREA">Texto Longo</option>
                            <option value="PHONE">Telefone</option>
                          </select>
                        </Field>

                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              {...register(`questions.${index}.required` as const)}
                              className="h-4 w-4 rounded border-border bg-input-background text-brand-primary focus:ring-brand-primary focus:ring-offset-card"
                            />
                            <span className="text-sm font-medium text-foreground">Obrigatória</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 rounded-xl bg-brand-primary py-2.5 text-sm font-medium text-white",
                "transition-all hover:bg-brand-primary/90 active:scale-[0.99]",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {isSubmitting
                ? "Salvando..."
                : isEditing
                ? "Salvar alterações"
                : "Criar consulta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center"
      >
        <div className={cn(
          "h-5 w-9 rounded-full border transition-all",
          checked ? "bg-brand-primary border-brand-primary" : "bg-switch-background border-border"
        )} />
        <div className={cn(
          "absolute h-4 w-4 rounded-full bg-white shadow transition-all",
          checked ? "left-4.5" : "left-0.5"
        )} />
      </button>
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
