import { describe, it, expect } from "vitest"
import { teamSchema, inviteMemberSchema } from "@/lib/validators/team"
import { profileSchema, availabilitySchema } from "@/lib/validators/onboarding"
import { createBookingSchema } from "@/lib/validators/booking"
import { eventTypeSchema, eventTypeQuestionSchema } from "@/lib/validators/event-type"
import { addDays, subDays } from "date-fns"

describe("Validators", () => {
  describe("teamSchema", () => {
    it("deve validar um time correto", () => {
      const result = teamSchema.safeParse({ name: "Team 1", slug: "team-1" })
      expect(result.success).toBe(true)
    })
    it("deve falhar sem nome", () => {
      const result = teamSchema.safeParse({ slug: "team-1" })
      expect(result.success).toBe(false)
    })
  })

  describe("inviteMemberSchema", () => {
    it("deve validar convite", () => {
      const result = inviteMemberSchema.safeParse({ teamId: "cuid123456789012345678901", email: "test@test.com" })
      expect(result.success).toBe(true)
    })
  })

  describe("profileSchema", () => {
    it("deve validar profile", () => {
      const result = profileSchema.safeParse({ name: "User", username: "user-1", timeZone: "UTC" })
      expect(result.success).toBe(true)
    })
  })

  describe("availabilitySchema", () => {
    it("deve validar disponibilidade", () => {
      const result = availabilitySchema.safeParse({
        scheduleId: "cuid123456789012345678901",
        timeZone: "UTC",
        availabilities: [
          {
            dayOfWeek: 1,
            enabled: true,
            intervals: [{ startTime: "09:00", endTime: "18:00" }]
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it("deve falhar com intervalos sobrepostos", () => {
      const result = availabilitySchema.safeParse({
        scheduleId: "cuid123456789012345678901",
        timeZone: "UTC",
        availabilities: [
          {
            dayOfWeek: 1,
            enabled: true,
            intervals: [
              { startTime: "09:00", endTime: "12:00" },
              { startTime: "11:00", endTime: "18:00" }
            ]
          }
        ]
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createBookingSchema", () => {
    it("deve validar agendamento futuro", () => {
      const tomorrow = addDays(new Date(), 1)
      const later = addDays(new Date(), 1)
      later.setHours(later.getHours() + 1)

      const result = createBookingSchema.safeParse({
        eventTypeId: "cuid123456789012345678901",
        ownerId: "cuid123456789012345678901",
        startTimeUtc: tomorrow.toISOString(),
        endTimeUtc: later.toISOString(),
        guestTimeZone: "UTC",
        guestName: "Guest",
        guestEmail: "guest@test.com"
      })
      expect(result.success).toBe(true)
    })

    it("deve falhar para agendamento no passado", () => {
      const past = subDays(new Date(), 1)
      const later = subDays(new Date(), 1)
      later.setHours(later.getHours() + 1)

      const result = createBookingSchema.safeParse({
        eventTypeId: "cuid123456789012345678901",
        ownerId: "cuid123456789012345678901",
        startTimeUtc: past.toISOString(),
        endTimeUtc: later.toISOString(),
        guestTimeZone: "UTC",
        guestName: "Guest",
        guestEmail: "guest@test.com"
      })
      expect(result.success).toBe(false)
    })
  })

  describe("eventTypeSchema", () => {
    it("deve validar um tipo de evento", () => {
      const result = eventTypeSchema.safeParse({
        title: "Meet",
        slug: "meet-1",
        duration: 30,
        color: "VIOLET",
        locationType: "GOOGLE_MEET"
      })
      expect(result.success).toBe(true)
    })
  })

  describe("eventTypeQuestionSchema", () => {
    it("deve validar questão", () => {
      const result = eventTypeQuestionSchema.safeParse({
        label: "Question?",
        type: "TEXT"
      })
      expect(result.success).toBe(true)
    })
  })
})