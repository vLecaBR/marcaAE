import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  sendWhatsAppConfirmation,
  sendWhatsAppPending,
  sendWhatsAppReminder,
  sendWhatsAppCancellation,
  type WhatsAppMessageData
} from "@/lib/whatsapp/send"

const mockData: WhatsAppMessageData = {
  phone: "11999999999",
  guestName: "Guest",
  eventTitle: "Event",
  ownerName: "Owner",
  startTime: new Date("2024-01-01T10:00:00Z"),
  appUrl: "http://localhost",
  uid: "uid-123"
}

describe("WhatsApp Service", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("não deve enviar se telefone for inválido", async () => {
    const result = await sendWhatsAppConfirmation({ ...mockData, phone: "123" })
    expect(result).toBe(false)
  })

  it("deve simular envio se API_URL e API_KEY não estiverem configuradas", async () => {
    process.env.WHATSAPP_API_URL = ""
    process.env.WHATSAPP_API_KEY = ""
    
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    
    const result = await sendWhatsAppConfirmation(mockData)
    expect(result).toBe(true)
    expect(consoleSpy).toHaveBeenCalled()
  })

  it("deve chamar fetch se API configurada e retornar erro se fetch falhar", async () => {
    process.env.WHATSAPP_API_URL = "http://api.test"
    process.env.WHATSAPP_API_KEY = "key123"
    
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network Error"))

    const result = await sendWhatsAppConfirmation(mockData)
    expect(fetch).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it("deve chamar fetch e retornar erro se status for NOK", async () => {
    process.env.WHATSAPP_API_URL = "http://api.test"
    process.env.WHATSAPP_API_KEY = "key123"
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Error message")
    } as any)

    const result = await sendWhatsAppPending(mockData)
    expect(result).toBe(false)
  })

  it("deve enviar com sucesso via fetch", async () => {
    process.env.WHATSAPP_API_URL = "http://api.test"
    process.env.WHATSAPP_API_KEY = "key123"
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("Success")
    } as any)

    const result = await sendWhatsAppReminder(mockData)
    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/message/sendText/InstanceName",
      expect.objectContaining({
        method: "POST",
        headers: { "apikey": "key123", "Content-Type": "application/json" }
      })
    )
  })

  it("deve enviar cancelamento simulado sem motivo", async () => {
    process.env.WHATSAPP_API_URL = ""
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    const result = await sendWhatsAppCancellation(mockData, null)
    expect(result).toBe(true)
    expect(consoleSpy).toHaveBeenCalled()
  })
})