"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { teamSchema, type TeamInput } from "@/lib/validators/team"
import { upsertTeamAction } from "@/lib/actions/team"
import { cn } from "@/lib/utils"

interface TeamFormProps {
  open: boolean
  onClose: () => void
  defaultValues?: Partial<TeamInput> & { id?: string }
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

export function TeamForm({ open, onClose, defaultValues }: TeamFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!defaultValues?.id

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      theme: "LIGHT",
      brandColor: "#0f9e8e",
      ...defaultValues,
    },
  })

  const nameValue = watch("name")

  useEffect(() => {
    if (!isEditing) {
      setValue("slug", slugify(nameValue ?? ""), { shouldValidate: false })
    }
  }, [nameValue, isEditing, setValue])

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        slug: "",
        description: "",
        ...defaultValues,
      })
      setServerError(null)
    }
  }, [open, defaultValues, reset])

  async function onSubmit(data: TeamInput) {
    setServerError(null)
    const payload = defaultValues?.id
      ? { ...data, id: defaultValues.id }
      : data

    const result = await upsertTeamAction(payload)

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
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Editar clínica" : "Nova clínica"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

          {/* Promessa de trial (§8.2): conecta o marketing à criação da clínica. Só ao criar. */}
          {!isEditing && (
            <div className="flex items-start gap-2.5 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
              <p className="text-sm text-foreground/80">
                Sua clínica começa com{" "}
                <span className="font-semibold text-brand-primary">30 dias de teste grátis</span> —
                todos os recursos premium liberados, sem cartão de crédito.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome da clínica</label>
            <input {...register("name")} placeholder="Ex: Clínica Bem Estar" className={inputClass} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Slug (URL)</label>
            <input {...register("slug")} placeholder="clinica-bem-estar" className={inputClass} />
            <p className="text-xs text-muted-foreground">Aparece na URL: marca-ai-app.vercel.app/equipe/slug</p>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
            <textarea
              {...register("description")}
              placeholder="Sobre a clínica..."
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Theme */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tema Público
              </label>
              <select
                {...register("theme")}
                className={cn(inputClass, "appearance-none")}
              >
                <option value="LIGHT">Claro (Light Mode)</option>
                <option value="DARK">Escuro (Dark Mode)</option>
                <option value="SYSTEM">Sistema (Automático)</option>
              </select>
              {errors.theme && (
                <p className="text-xs text-destructive">{errors.theme.message}</p>
              )}
            </div>

            {/* Brand Color */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Cor da Marca (Hex)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  aria-label="Seletor de cor da marca"
                  {...register("brandColor")}
                  className="h-10 w-14 rounded-xl cursor-pointer border border-border p-0"
                />
                <input
                  type="text"
                  {...register("brandColor")}
                  placeholder="#0f9e8e"
                  className={cn(inputClass, errors.brandColor && "border-destructive/60 focus:border-destructive")}
                />
              </div>
              {errors.brandColor && (
                <p className="text-xs text-destructive">{errors.brandColor.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
                "flex-1 rounded-xl bg-brand-primary py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99]",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar clínica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass = "w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
