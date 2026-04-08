import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  sendBookingConfirmedEmail,
  sendBookingPendingEmail,
  sendBookingCancelledEmail,
  sendOwnerNotifyEmail
} from "@/lib/email/send"
import { resend } from "@/lib/email/resend"

vi.mock("@/lib/email/resend", () => ({
  resend: {
    emails: { send: vi.fn() }
  },
  FROM_EMAIL: "test@domain.com",
  APP_URL: "http://localhost:3000"
}))

// Ignore React Email rendering logs/errors in test
vi.mock("@react-email/components", () => ({
  render: vi.fn(() => Promise.resolve("<html>mock html</html>")),
  Html: vi.fn(),
  Head: vi.fn(),
  Preview: vi.fn(),
  Body: vi.fn(),
  Container: vi.fn(),
  Section: vi.fn(),
  Text: vi.fn(),
  Link: vi.fn(),
}))

vi.mock("@/emails/booking-confirmed", () => ({ BookingConfirmedEmail: vi.fn() }))
vi.mock("@/emails/booking-pending", () => ({ BookingPendingEmail: vi.fn() }))
vi.mock("@/emails/booking-cancelled", () => ({ BookingCancelledEmail: vi.fn() }))
vi.mock("@/emails/booking-owner-notify", () => ({ BookingOwnerNotifyEmail: vi.fn() }))

const mockEmailData = {
  uid: "test-uid",
  guestName: "Guest",
  guestEmail: "guest@example.com",
  ownerName: "Owner",
  ownerEmail: "owner@example.com",
  eventTitle: "30 Min Meet",
  startTime: new Date("2024-01-01T10:00:00Z"),
  endTime: new Date("2024-01-01T10:30:00Z"),
  guestTimeZone: "UTC",
  ownerTimeZone: "UTC",
  locationType: "GOOGLE_MEET" as any,
  meetingUrl: null,
  requiresConfirm: false,
}

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendBookingConfirmedEmail", () => {
    it("deve enviar email de confirmação com sucesso", async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: "resend-id" } } as any)
      const result = await sendBookingConfirmedEmail(mockEmailData)
      expect(resend.emails.send).toHaveBeenCalled()
      expect(result).toEqual({ success: true, id: "resend-id" })
    })

    it("deve retornar erro se a API do resend falhar", async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ error: { message: "Resend Error", name: "Error" } } as any)
      const result = await sendBookingConfirmedEmail(mockEmailData)
      expect(result).toEqual({ success: false, error: "Resend Error" })
    })
  })

  describe("sendBookingPendingEmail", () => {
    it("deve enviar email pendente com sucesso", async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: "resend-id" } } as any)
      const result = await sendBookingPendingEmail(mockEmailData)
      expect(resend.emails.send).toHaveBeenCalled()
      expect(result).toEqual({ success: true, id: "resend-id" })
    })

    it("deve retornar erro caso resend falhe", async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ error: { message: "API Error", name: "Error" } } as any)
      const result = await sendBookingPendingEmail(mockEmailData)
      expect(result.success).toBe(false)
    })
  })

  describe("sendBookingCancelledEmail", () => {
    it("deve enviar email de cancelamento com sucesso", async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({ data: { id: "resend-id" } } as any)
      const result = await sendBookingCancelledEmail(mockEmailData, "Motivo", false)
      expect(resend.emails.send).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ success: true, id: "resend-id" })
    })

    it("deve enviar email para convidado e organizador", async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({ data: { id: "resend-id" } } as any)
      const result = await sendBookingCancelledEmail(mockEmailData, "Motivo", true)
      expect(resend.emails.send).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true, id: "resend-id" })
    })
  })

  describe("sendOwnerNotifyEmail", () => {
    it("deve notificar organizador com sucesso", async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: "resend-id" } } as any)
      const result = await sendOwnerNotifyEmail(mockEmailData)
      expect(resend.emails.send).toHaveBeenCalled()
      expect(result).toEqual({ success: true, id: "resend-id" })
    })
  })
})