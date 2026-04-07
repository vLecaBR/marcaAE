import { describe, it, expect, vi, beforeEach } from "vitest"
import { getGoogleCalendarBusySlots, createGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/google/calendar"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    }
  }
}))

describe("Google Calendar Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    process.env.AUTH_GOOGLE_ID = "google-id"
    process.env.AUTH_GOOGLE_SECRET = "google-secret"
  })

  describe("getValidAccessToken", () => {
    it("deve retornar token válido se ainda não expirou", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600 // Expira daqui a 1 hora
      } as any)

      const result = await getGoogleCalendarBusySlots("user-1", new Date(), new Date())
      // Só de não ter fetch no auth URL significa que o token estava válido
      expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("token"), expect.any(Object))
    })

    it("deve dar refresh no token se estiver expirado e atualizar no banco", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "expired-token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expirado há 1 hora
        refresh_token: "refresh-token"
      } as any)

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: "new-token", expires_in: 3600 })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ calendars: { primary: { busy: [] } } })
        } as any)

      const result = await getGoogleCalendarBusySlots("user-1", new Date(), new Date())

      expect(prisma.account.update).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual([])
    })
  })

  describe("getGoogleCalendarBusySlots", () => {
    it("deve retornar empty se usuário não tiver conta conectada", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null)
      const result = await getGoogleCalendarBusySlots("user-1", new Date(), new Date())
      expect(result).toEqual([])
    })

    it("deve mapear os slots recebidos do Google", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          calendars: {
            primary: {
              busy: [
                { start: "2024-01-01T10:00:00Z", end: "2024-01-01T11:00:00Z" }
              ]
            }
          }
        })
      } as any)

      const result = await getGoogleCalendarBusySlots("user-1", new Date(), new Date())
      expect(result).toHaveLength(1)
      expect(result[0].start).toEqual(new Date("2024-01-01T10:00:00Z"))
      expect(result[0].end).toEqual(new Date("2024-01-01T11:00:00Z"))
    })
  })

  describe("createGoogleCalendarEvent", () => {
    it("deve retornar null se usuário não tiver conta do google", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null)
      const result = await createGoogleCalendarEvent({
        userId: "user-1",
        title: "Test",
        description: "Test",
        guestName: "Guest",
        guestEmail: "guest@test.com",
        startTime: new Date(),
        endTime: new Date(),
      })
      expect(result).toBeNull()
    })

    it("deve criar evento no google calendar", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: "google-event-id",
          conferenceData: {
            entryPoints: [
              { entryPointType: "video", uri: "http://meet.google.com/link" }
            ]
          }
        })
      } as any)

      const result = await createGoogleCalendarEvent({
        userId: "user-1",
        title: "Test Event",
        description: "Desc",
        startTime: new Date(),
        endTime: new Date(),
        guestEmail: "guest@test.com",
        guestName: "Guest",
        createMeetLink: true,
        recurringCount: 2, // Testing recurring string logic
      })

      expect(fetch).toHaveBeenCalled()
      expect(result).toEqual({ eventId: "google-event-id", meetLink: "http://meet.google.com/link" })
    })

    it("deve retornar null em caso de erro na API ao criar evento", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Bad Request")
      } as any)

      const result = await createGoogleCalendarEvent({
        userId: "user-1",
        title: "Test Event",
        description: "Desc",
        startTime: new Date(),
        endTime: new Date(),
        guestEmail: "guest@test.com",
        guestName: "Guest",
      })

      expect(result).toBeNull()
    })
  })

  describe("deleteGoogleCalendarEvent", () => {
    it("deve retornar false se usuário não tiver conta do google", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null)
      const result = await deleteGoogleCalendarEvent("user-1", "event-id")
      expect(result).toBe(false)
    })

    it("deve retornar true se a deleção for bem sucedida (ou 404)", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as any)

      const result = await deleteGoogleCalendarEvent("user-1", "event-id")
      expect(result).toBe(true)
    })

    it("deve retornar true se a API retornar 404", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as any)

      const result = await deleteGoogleCalendarEvent("user-1", "event-id")
      expect(result).toBe(true)
    })

    it("deve retornar false em caso de falha diferente de 404", async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: "acc-1",
        provider: "google",
        access_token: "valid-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600
      } as any)

      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as any)

      const result = await deleteGoogleCalendarEvent("user-1", "event-id")
      expect(result).toBe(false)
    })
  })
})