import { describe, it, expect, vi, beforeEach } from "vitest"
import { createBooking, cancelBooking } from "@/lib/actions/booking"
import { prisma } from "@/lib/prisma"
import { createPixPayment } from "@/lib/payments/mercadopago"
import { createGoogleCalendarEvent } from "@/lib/google/calendar"
import { sendBookingCancelledEmail } from "@/lib/email/send"

// Mock the module imports for payments and google calendar
vi.mock("@/lib/payments/mercadopago", () => ({
  createPixPayment: vi.fn(),
}))

vi.mock("@/lib/google/calendar", () => ({
  createGoogleCalendarEvent: vi.fn(),
}))

vi.mock("@/lib/email/send", () => ({
  sendBookingConfirmedEmail: vi.fn(),
  sendBookingPendingEmail: vi.fn(),
  sendOwnerNotifyEmail: vi.fn(),
  sendBookingCancelledEmail: vi.fn(),
}))

vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = {
        send: vi.fn().mockResolvedValue({ data: { id: "mock-resend-id" }, error: null })
      }
    }
  }
})

// A minimal mock of prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventType: { findFirst: vi.fn() },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(async (cb) => {
      // Pass a mocked tx object
      return cb({
        $queryRaw: vi.fn().mockResolvedValue([]),
        booking: {
          create: vi.fn().mockResolvedValue({
            id: "b-1",
            uid: "uid-1",
            guestEmail: "guest@test.com",
            guestName: "Guest",
            eventType: {
              title: "Test Event",
              user: { name: "Owner" }
            }
          }),
        }
      })
    })
  }
}))

// We need a helper to mock out buildAvailableWindows easily without hitting the real one
vi.mock("@/lib/scheduling/availability", () => ({
  buildAvailableWindows: vi.fn().mockReturnValue([
    {
      date: new Date(),
      dayOfWeek: 1,
      windows: [{ start: new Date("2024-01-01T00:00:00Z"), end: new Date("2024-01-01T23:59:59Z") }]
    }
  ])
}))

describe("Booking Server Actions (Unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createBooking", () => {
    it("deve falhar se evento nao existir", async () => {
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce(null)
      const res = await createBooking({
        eventTypeId: "evt",
        ownerId: "own",
        startTimeUtc: "2024-01-01T10:00:00Z",
        endTimeUtc: "2024-01-01T10:30:00Z",
        guestTimeZone: "UTC",
        guestName: "Guest",
        guestEmail: "guest@test.com",
        responses: [],
      })
      expect(res.status).toBe("not_found")
    })

    it("deve falhar se a duracao nao bater", async () => {
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce({
        duration: 45,
        user: { schedules: [{}] }
      } as any)
      const res = await createBooking({
        eventTypeId: "evt",
        ownerId: "own",
        startTimeUtc: "2024-01-01T10:00:00Z",
        endTimeUtc: "2024-01-01T10:30:00Z", // 30min
        guestTimeZone: "UTC",
        guestName: "Guest",
        guestEmail: "guest@test.com",
        responses: [],
      })
      expect(res.status).toBe("validation")
    })

    it("deve criar um booking com sucesso e processar async extras", async () => {
      // Mock event type valid
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce({
        duration: 30,
        price: 1000,
        locationType: "GOOGLE_MEET",
        user: {
          schedules: [{
            timeZone: "UTC",
            availabilities: [],
            exceptions: []
          }]
        }
      } as any)

      // Mock user (owner) found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        email: "owner@test.com",
        timeZone: "UTC"
      } as any)

      // Let Mercadopago integration succeed
      vi.mocked(createPixPayment).mockResolvedValueOnce({ ticketUrl: "pix-url", id: "pix-id" } as any)

      // Let Google Calendar succeed
      vi.mocked(createGoogleCalendarEvent).mockResolvedValueOnce({ eventId: "g-1", meetLink: "link" } as any)

      const res = await createBooking({
        eventTypeId: "evt",
        ownerId: "own",
        startTimeUtc: "2024-01-01T10:00:00Z",
        endTimeUtc: "2024-01-01T10:30:00Z",
        guestTimeZone: "UTC",
        guestName: "Guest",
        guestEmail: "guest@test.com",
        responses: [],
      })

      expect(res.status).toBe("success")
      if (res.status === "success") {
        expect(res.data.pixData?.ticketUrl).toBe("pix-url")
      }
    })
  })

  describe("cancelBooking", () => {
    it("deve falhar se booking não for encontrado", async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce(null)
      const res = await cancelBooking("uid-1", "reason", "OWNER")
      expect(res.status).toBe("not_found")
    })

    it("deve falhar se já estiver cancelado", async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        status: "CANCELLED"
      } as any)
      const res = await cancelBooking("uid-1", "reason", "OWNER")
      expect(res.status).toBe("forbidden")
    })

    it("deve cancelar com sucesso e chamar notificacoes", async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        status: "CONFIRMED",
        uid: "uid-1",
        guestName: "Guest",
        guestEmail: "guest@test.com",
        startTime: new Date(),
        endTime: new Date(),
        guestTimeZone: "UTC",
        eventType: {
          title: "Test Event",
          locationType: "CUSTOM",
          user: { name: "Owner", email: "owner@test.com", timeZone: "UTC" }
        }
      } as any)

      vi.mocked(prisma.booking.update).mockResolvedValueOnce({} as any)

      const res = await cancelBooking("uid-1", "reason", "OWNER")
      expect(res.status).toBe("success")
      
      expect(sendBookingCancelledEmail).toHaveBeenCalled()
    })
  })
})