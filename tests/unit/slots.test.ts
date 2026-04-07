import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { computeAvailableSlots, groupSlotsByDate, getAvailableDates } from "@/lib/scheduling/slots"

describe("Slots Utility", () => {
  const originalNow = Date.now

  beforeEach(() => {
    // Mock current time to 2024-01-01T00:00:00Z for tests
    vi.spyOn(Date, "now").mockImplementation(() => new Date("2024-01-01T00:00:00Z").getTime())
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("computeAvailableSlots", () => {
    const defaultInput = {
      userId: "user-1",
      eventDuration: 30,
      beforeBuffer: 0,
      afterBuffer: 0,
      viewerTimeZone: "UTC",
      dateFrom: new Date("2024-01-01T00:00:00Z"),
      dateTo: new Date("2024-01-03T00:00:00Z"),
      bookingLimitDays: 2,
    }

    const availableWindows = [
      {
        date: new Date("2024-01-01T00:00:00Z"),
        dayOfWeek: 1,
        windows: [{ start: new Date("2024-01-01T10:00:00Z"), end: new Date("2024-01-01T12:00:00Z") }]
      },
      {
        date: new Date("2024-01-04T00:00:00Z"), // Fora do bookingLimitDays (2)
        dayOfWeek: 4,
        windows: [{ start: new Date("2024-01-04T10:00:00Z"), end: new Date("2024-01-04T12:00:00Z") }]
      }
    ]

    it("deve computar slots baseando-se nas janelas e ignorar acima do limite", () => {
      const slots = computeAvailableSlots(availableWindows, [], defaultInput)
      
      // Tem janela de 2 horas em 1 dia, duracao 30m -> 4 slots
      // O segundo dia (dia 4) é ignorado porque limitDays é 2.
      expect(slots).toHaveLength(4)
      expect(slots[0].startUtc.toISOString()).toBe("2024-01-01T10:00:00.000Z")
      expect(slots[1].startUtc.toISOString()).toBe("2024-01-01T10:30:00.000Z")
    })

    it("deve subtrair horários já ocupados", () => {
      const existingBookings = [
        {
          startTime: new Date("2024-01-01T10:30:00Z"),
          endTime: new Date("2024-01-01T11:00:00Z"),
        }
      ]

      const slots = computeAvailableSlots(availableWindows, existingBookings, defaultInput)
      
      // 10:00-10:30 (sim), 10:30-11:00 (não), 11:00-11:30 (sim), 11:30-12:00 (sim)
      expect(slots).toHaveLength(3)
      expect(slots[0].startUtc.toISOString()).toBe("2024-01-01T10:00:00.000Z")
      expect(slots[1].startUtc.toISOString()).toBe("2024-01-01T11:00:00.000Z")
      expect(slots[2].startUtc.toISOString()).toBe("2024-01-01T11:30:00.000Z")
    })

    it("deve considerar buffer antes e depois da reuniao", () => {
      const inputWithBuffer = { ...defaultInput, beforeBuffer: 15, afterBuffer: 15 }
      const existingBookings = [
        {
          startTime: new Date("2024-01-01T10:45:00Z"),
          endTime: new Date("2024-01-01T11:15:00Z"),
        }
      ]

      const slots = computeAvailableSlots(availableWindows, existingBookings, inputWithBuffer)
      
      // Janela disponível: 10:00 - 12:00
      // Com buffer de 15m para o conflito, ele vai ocupar de 10:30 a 11:30 (10:45-15, 11:15+15)
      // Slot precisa de 15 + 30 + 15 = 60m livre total.
      // E começa após o buffer
      // 10:00 -> 11:00 (slot real de 10:15 as 10:45. Ocupado depois de 10:30, mas 10:45 é start do evento, entao cabe. Wait, subtractBusy will remove 10:30-11:30. Free: 10:00-10:30, 11:30-12:00)
      // Cabe um bloco de 60m no 10:00-10:30? Nao. Em 11:30-12:00? Nao. Entao array de slots será vazio!
      // Vamos ajustar a janela para 10:00 as 13:00
      const widerWindow = [{
        date: new Date("2024-01-01T00:00:00Z"),
        dayOfWeek: 1,
        windows: [{ start: new Date("2024-01-01T10:00:00Z"), end: new Date("2024-01-01T13:00:00Z") }]
      }]

      // Ocupado: 10:30 as 11:30
      // Livre: 10:00 as 10:30 (30m) - Nao cabe 60m
      // Livre: 11:30 as 13:00 (90m) - Cabe 1 bloco de 60m (inicia 11:30, slot começa 11:45 e termina 12:15)
      const slotsWider = computeAvailableSlots(widerWindow, existingBookings, inputWithBuffer)
      
      expect(slotsWider).toHaveLength(1)
      expect(slotsWider[0].startUtc.toISOString()).toBe("2024-01-01T11:45:00.000Z")
      expect(slotsWider[0].endUtc.toISOString()).toBe("2024-01-01T12:15:00.000Z")
    })

    it("deve ignorar slots no passado", () => {
      // Mock now = 11:15
      vi.setSystemTime(new Date("2024-01-01T11:15:00Z"))
      const slots = computeAvailableSlots(availableWindows, [], defaultInput)
      
      // Janela 10 as 12. Slots normais: 10:00, 10:30, 11:00, 11:30
      // Já passou 11:15. Sobra só 11:30
      expect(slots).toHaveLength(1)
      expect(slots[0].startUtc.toISOString()).toBe("2024-01-01T11:30:00.000Z")
    })
  })

  describe("groupSlotsByDate", () => {
    it("deve agrupar os slots pela data", () => {
      const slots: any = [
        { startUtc: new Date("2024-01-01T10:00:00Z") },
        { startUtc: new Date("2024-01-01T11:00:00Z") },
        { startUtc: new Date("2024-01-02T10:00:00Z") },
      ]

      const grouped = groupSlotsByDate(slots, "UTC")
      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped["2024-01-01"]).toHaveLength(2)
      expect(grouped["2024-01-02"]).toHaveLength(1)
    })
  })

  describe("getAvailableDates", () => {
    it("deve retornar array de strings de datas disponiveis ordenadas", () => {
      const slots: any = [
        { startUtc: new Date("2024-01-02T10:00:00Z") },
        { startUtc: new Date("2024-01-01T10:00:00Z") },
      ]

      const dates = getAvailableDates(slots, "UTC")
      expect(dates).toHaveLength(2)
      expect(dates[0]).toBe("2024-01-01")
      expect(dates[1]).toBe("2024-01-02")
    })
  })
})