import { z } from "zod"

/**
 * Validação do perfil profissional de saúde (onboarding e edição).
 * Campos clínicos: especialidade, conselho + registro, clínica. Ver spec §3 (dados médicos).
 *
 * Nota de integração: a API .NET (`UpdateProfileInput`) hoje aceita name/username/timeZone/bio.
 * Os campos clínicos (specialty/council/registrationNumber/clinicName) são enviados de forma
 * forward-compatible; a persistência depende de estender o DTO (ver docs/backend-backlog.md).
 */

/** Conselhos profissionais de saúde no Brasil. */
export const COUNCILS = [
  { value: "CRM", label: "CRM — Medicina" },
  { value: "CRP", label: "CRP — Psicologia" },
  { value: "CRO", label: "CRO — Odontologia" },
  { value: "CREFITO", label: "CREFITO — Fisio/Terapia Ocupacional" },
  { value: "CRN", label: "CRN — Nutrição" },
  { value: "CREFONO", label: "CREFONO — Fonoaudiologia" },
  { value: "COREN", label: "COREN — Enfermagem" },
  { value: "CRMV", label: "CRMV — Medicina Veterinária" },
  { value: "OUTRO", label: "Outro" },
] as const

export const COUNCIL_VALUES = COUNCILS.map((c) => c.value) as [string, ...string[]]

const optionalTrimmed = (max: number, msg: string) =>
  z.string().trim().max(max, msg).optional().or(z.literal(""))

export const healthProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "Nome muito longo."),
  specialty: z
    .string()
    .trim()
    .min(2, "Informe sua especialidade.")
    .max(60, "Especialidade muito longa."),
  council: z.enum(COUNCIL_VALUES, { error: "Selecione o conselho." }),
  registrationNumber: z
    .string()
    .trim()
    .min(2, "Informe o número de registro.")
    .max(30, "Registro muito longo."),
  clinicName: optionalTrimmed(80, "Nome da clínica muito longo."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Mínimo de 3 caracteres.")
    .max(32, "Máximo de 32 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  bio: optionalTrimmed(160, "Máximo de 160 caracteres."),
  timeZone: z.string().min(1, "Selecione seu fuso horário."),
})

export type HealthProfileInput = z.infer<typeof healthProfileSchema>

/** Campos por etapa do wizard — usados para validar antes de avançar. */
export const STEP_FIELDS: readonly (keyof HealthProfileInput)[][] = [
  ["name", "specialty", "council", "registrationNumber"],
  ["username", "clinicName", "bio"],
  ["timeZone"],
]

/** Fusos comuns no Brasil + fallback. O padrão é detectado no cliente. */
export const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Manaus",
  "America/Cuiaba",
  "America/Belem",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
] as const
