"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { profileSchema, type ProfileInput } from "@/lib/validators/onboarding"
import { completeProfileAction } from "@/lib/actions/onboarding"
import { cn } from "@/lib/utils"

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/New_York", label: "Nova York (GMT-5)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Madrid", label: "Madri (GMT+1)" },
  { value: "UTC", label: "UTC (GMT+0)" },
]

interface StepProfileProps {
  user: {
    name: string | null
    username: string | null
    timeZone: string
    bio: string | null
    image: string | null
    email: string
  }
  onSuccess: () => void
}

export function StepProfile({ user, onSuccess }: StepProfileProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      username: user.username ?? "",
      timeZone: user.timeZone ?? "America/Sao_Paulo",
      bio: user.bio ?? "",
    },
  })

  const usernameValue = watch("username")

  async function onSubmit(data: ProfileInput) {
    setServerError(null)
    const result = await completeProfileAction(data)
    if (result.success) {
      onSuccess()
    } else {
      setServerError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Seu perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estas informações aparecem na sua página pública de agendamento.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Avatar preview */}
      {user.image && (
        <div className="flex items-center gap-4">
          <img
            src={user.image}
            alt={user.name ?? "Avatar"}
            className="h-14 w-14 rounded-full ring-2 ring-border"
          />
          <div>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">Foto sincronizada com o Google</p>
          </div>
        </div>
      )}

      {/* Nome */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input
          {...register("name")}
          placeholder="Seu nome"
          className={cn(inputClass, errors.name && errorInputClass)}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Username público
        </label>
        <div className="flex rounded-xl overflow-hidden border border-border bg-input-background focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
          <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-border select-none">
            peopleos.app/
          </span>
          <input
            {...register("username")}
            placeholder="seu-username"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {errors.username ? (
          <p className="text-xs text-destructive">{errors.username.message}</p>
        ) : (
          usernameValue && (
            <p className="text-xs text-muted-foreground">
              peopleos.app/<span className="text-brand-primary">{usernameValue}</span>
            </p>
          )
        )}
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Fuso horário
        </label>
        <select
          {...register("timeZone")}
          className={cn(inputClass, "appearance-none")}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors.timeZone && (
          <p className="text-xs text-destructive">{errors.timeZone.message}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Bio{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          {...register("bio")}
          placeholder="Breve descrição sobre você ou seu trabalho..."
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
        {errors.bio && (
          <p className="text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white",
          "transition-all hover:bg-brand-primary/90 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
      >
        {isSubmitting ? "Salvando..." : "Continuar →"}
      </button>
    </form>
  )
}

const inputClass =
  "w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"

const errorInputClass = "border-destructive/60 focus:border-destructive focus:ring-destructive"