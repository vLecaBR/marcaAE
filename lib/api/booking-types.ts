/**
 * Tipos do fluxo de agendamento público (client-safe — sem `server-only`).
 * Substitui os tipos que vinham de `lib/scheduling/*` (removido no extermínio do Prisma).
 * A API .NET (`GET /slots`) devolve horários em UTC (ISO string).
 */

/** Slot de horário livre — datas em ISO (UTC). */
export interface Slot {
  startUtc: string
  endUtc: string
}

/** `GET /public/{username}` → perfil público + serviços ativos. */
export interface PublicEventTypeDto {
  id: string
  title: string
  slug: string
  description: string | null
  duration: number
  color: string
  locationType: string
  price: number | null
  currency?: string
}

export interface PublicProfileWithEventsDto {
  /** Id do profissional (ownerId). Necessário para `/slots` e `/bookings` públicos.
   *  Depende de o backend expô-lo em `GET /public/{username}` — ver docs/backend-backlog.md. */
  id?: string
  username: string
  name: string | null
  bio: string | null
  image: string | null
  brandColor: string | null
  theme: string
  timeZone: string
  eventTypes: PublicEventTypeDto[]
}

/** `GET /bookings/{uid}` → detalhe da consulta (confirmação). */
export interface BookingDetailDto {
  uid: string
  status: string
  paymentStatus?: string
  eventTitle: string
  ownerName: string | null
  startTime: string
  endTime: string
  guestName: string
  guestEmail: string
  guestTimeZone: string
  locationType: string
  meetingUrl: string | null
}
