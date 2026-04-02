import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { computeAvailableSlots } from "@/lib/scheduling/slots"
import { addMinutes, addHours, startOfDay, parseISO } from "date-fns"

describe("Scheduling Engine - computeAvailableSlots", () => {
  beforeEach(() => {
    // Congela o tempo para garantir que os slots "no passado" sejam previsíveis
    vi.useFakeTimers()
    vi.setSystemTime(parseISO("2024-03-10T08:00:00Z")) // <- Mudamos para mais cedo
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("deve gerar slots corretamente para uma janela de disponibilidade livre", () => {
    const start = parseISO("2024-03-10T11:00:00Z")
    const end = parseISO("2024-03-10T13:00:00Z")

    const availableWindows = [
      {
        date: startOfDay(start),
        dayOfWeek: 0,
        windows: [{ start, end }],
      },
    ]

    const slots = computeAvailableSlots(availableWindows, [], {
      userId: "user-1",
      eventDuration: 30, // 30 minutos
      beforeBuffer: 0,
      afterBuffer: 0,
      dateFrom: startOfDay(start),
      dateTo: end,
      viewerTimeZone: "UTC",
    })

    // Janela de 2 horas (120 minutos) / 30 minutos = 4 slots
    expect(slots.length).toBe(4)
    expect(slots[0].startUtc).toEqual(parseISO("2024-03-10T11:00:00Z"))
    expect(slots[0].endUtc).toEqual(parseISO("2024-03-10T11:30:00Z"))
    expect(slots[3].startUtc).toEqual(parseISO("2024-03-10T12:30:00Z"))
    expect(slots[3].endUtc).toEqual(parseISO("2024-03-10T13:00:00Z"))
  })

  it("deve subtrair conflitos (agendamentos existentes) corretamente", () => {
    const start = parseISO("2024-03-10T11:00:00Z")
    const end = parseISO("2024-03-10T13:00:00Z")

    const availableWindows = [
      {
        date: startOfDay(start),
        dayOfWeek: 0,
        windows: [{ start, end }],
      },
    ]

    // Um evento marcado bem no meio da janela, das 11:30 às 12:00
    const existingBookings = [
      {
        startTime: parseISO("2024-03-10T11:30:00Z"),
        endTime: parseISO("2024-03-10T12:00:00Z"),
      },
    ]

    const slots = computeAvailableSlots(availableWindows, existingBookings, {
      userId: "user-1",
      eventDuration: 30,
      beforeBuffer: 0,
      afterBuffer: 0,
      dateFrom: startOfDay(start),
      dateTo: end,
      viewerTimeZone: "UTC",
    })

    // Deve gerar apenas 3 slots agora (11:00, 12:00, 12:30)
    expect(slots.length).toBe(3)
    expect(slots[0].startUtc).toEqual(parseISO("2024-03-10T11:00:00Z"))
    expect(slots[1].startUtc).toEqual(parseISO("2024-03-10T12:00:00Z"))
    expect(slots[2].startUtc).toEqual(parseISO("2024-03-10T12:30:00Z"))
  })

  it("deve respeitar os buffers antes e depois de cada evento", () => {
    // Janela de 4 horas: 10:00 às 14:00
    const start = parseISO("2024-03-10T10:00:00Z")
    const end = parseISO("2024-03-10T14:00:00Z")

    const availableWindows = [
      {
        date: startOfDay(start),
        dayOfWeek: 0,
        windows: [{ start, end }],
      },
    ]

    // Evento marcado das 11:30 às 12:00
    const existingBookings = [
      {
        startTime: parseISO("2024-03-10T11:30:00Z"),
        endTime: parseISO("2024-03-10T12:00:00Z"),
      },
    ]

    // Buffer de 30 minutos DEPOIS do evento
    // O evento existente bloqueará das 11:30 até 12:30
    // Os novos slots (30 min) precisarão de 60 min livres (30 min slot + 30 min buffer)
    const slots = computeAvailableSlots(availableWindows, existingBookings, {
      userId: "user-1",
      eventDuration: 30,
      beforeBuffer: 0,
      afterBuffer: 30,
      dateFrom: startOfDay(start),
      dateTo: end,
      viewerTimeZone: "UTC",
    })

    // Fragmento 1: 10:00 às 11:30. Caberá apenas 1 slot: 10:00-10:30 (ocupando até 11:00 com o buffer)
    // O próximo começaria 11:00 e ocuparia até 12:00, mas o fragmento termina 11:30, então é descartado.
    // Fragmento 2: 12:30 às 14:00. Caberá apenas 1 slot: 12:30-13:00 (ocupando até 13:30)
    // O próximo começaria 13:30 e iria até 14:30, estourando a janela de 14:00.
    expect(slots.length).toBe(2)
    expect(slots[0].startUtc).toEqual(parseISO("2024-03-10T10:00:00Z"))
    expect(slots[1].startUtc).toEqual(parseISO("2024-03-10T12:30:00Z"))
  })

  it("não deve gerar slots no passado (antes de 'now')", () => {
    vi.setSystemTime(parseISO("2024-03-10T10:00:00Z")) // Volta o tempo só pra esse teste

    // Janela começa ANTES de 'now' que está mockado para 10:00
    const start = parseISO("2024-03-10T09:00:00Z")
    const end = parseISO("2024-03-10T11:00:00Z")

    const availableWindows = [
      {
        date: startOfDay(start),
        dayOfWeek: 0,
        windows: [{ start, end }],
      },
    ]

    const slots = computeAvailableSlots(availableWindows, [], {
      userId: "user-1",
      eventDuration: 30,
      beforeBuffer: 0,
      afterBuffer: 0,
      dateFrom: startOfDay(start),
      dateTo: end,
      viewerTimeZone: "UTC",
    })

    // Dos 4 slots (09:00, 09:30, 10:00, 10:30), os dois primeiros estão no passado
    // O slot de 10:00 começa exatamente no "now", então deve ser pulado também (isAfter é estrito)
    // Sobrando apenas o de 10:30
    expect(slots.length).toBe(1)
    expect(slots[0].startUtc).toEqual(parseISO("2024-03-10T10:30:00Z"))
  })
})
