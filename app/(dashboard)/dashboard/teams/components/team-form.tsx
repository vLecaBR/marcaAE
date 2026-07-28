"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { teamSchema, type TeamInput } from "@/lib/validators/team"
import { upsertTeamAction } from "@/lib/actions/team"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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

/** Estilo compartilhado para controles nativos (select/textarea) alinhado ao primitivo Input. */
const controlClass =
  "w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar clínica" : "Nova clínica"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <Label htmlFor="team-name">Nome da clínica</Label>
            <Input id="team-name" {...register("name")} placeholder="Ex: Clínica Bem Estar" aria-invalid={!!errors.name} className="rounded-xl h-10" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-slug">Slug (URL)</Label>
            <Input id="team-slug" {...register("slug")} placeholder="clinica-bem-estar" aria-invalid={!!errors.slug} className="rounded-xl h-10" />
            <p className="text-xs text-muted-foreground">Aparece na URL: marca-ai-app.vercel.app/equipe/slug</p>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-description">Descrição (opcional)</Label>
            <textarea
              id="team-description"
              {...register("description")}
              placeholder="Sobre a clínica..."
              rows={3}
              className={cn(controlClass, "resize-none")}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Theme */}
            <div className="space-y-1.5">
              <Label htmlFor="team-theme">Tema Público</Label>
              <select id="team-theme" {...register("theme")} className={cn(controlClass, "h-10 appearance-none")}>
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
              <Label htmlFor="team-brand-color">Cor da Marca (Hex)</Label>
              <div className="flex gap-3">
                <input
                  id="team-brand-color"
                  type="color"
                  aria-label="Seletor de cor da marca"
                  {...register("brandColor")}
                  className="h-10 w-14 shrink-0 rounded-xl cursor-pointer border border-input p-0"
                />
                <Input
                  type="text"
                  {...register("brandColor")}
                  placeholder="#0f9e8e"
                  aria-invalid={!!errors.brandColor}
                  className="rounded-xl h-10"
                />
              </div>
              {errors.brandColor && (
                <p className="text-xs text-destructive">{errors.brandColor.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar clínica"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
