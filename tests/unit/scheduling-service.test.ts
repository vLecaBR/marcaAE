import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAvailableSlots } from "@/lib/scheduling/service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventType: {
      findFirst: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    }
  }
}))

// Mock do next/cache e date-fns se necessário
vi.mock("date-fns", async (importOriginal) => {
  const mod = await importOriginal<typeof import("date-fns")>()
  return {
    ...mod,
    // Fix timezone issues in tests by mocking what's needed or just letting it run
  }
})

describe("Scheduling Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAvailableSlots", () => {
    it("deve retornar erro se tipo de evento não for encontrado", async () => {
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce(null)
      const res = await getAvailableSlots({
        username: "test",
        eventSlug: "test-event",
        viewerTimeZone: "UTC"
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe("Tipo de evento não encontrado.")
    })

    it("deve retornar erro se agenda não estiver configurada", async () => {
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce({
        id: "event-1",
        title: "Test Event",
        duration: 30,
        user: {
          id: "user-1",
          name: "Test",
          image: null,
          schedules: [] // Vazio
        }
      } as any)

      const res = await getAvailableSlots({
        username: "test",
        eventSlug: "test-event",
        viewerTimeZone: "UTC"
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe("Agenda não configurada.")
    })

    it("deve processar com sucesso quando tudo existe e não há bookings conflitantes", async () => {
      vi.mocked(prisma.eventType.findFirst).mockResolvedValueOnce({
        id: "event-1",
        title: "Test Event",
        duration: 30,
        bookingLimitDays: 10,
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        user: {
          id: "user-1",
          name: "Test",
          image: null,
          schedules: [{
            timeZone: "UTC",
            availabilities: [{
              dayOfWeek: new Date().getDay(),
              startTime: "09:00",
              endTime: "17:00",
            }],
            exceptions: []
          }]
        }
      } as any)

      vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([])

      const res = await getAvailableSlots({
        username: "test",
        eventSlug: "test-event",
        viewerTimeZone: "UTC",
        dateFrom: new Date(),
        dateTo: new Date(Date.now() + 86400000)
      })

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data?.eventType.title).toBe("Test Event")
    })
  })
})