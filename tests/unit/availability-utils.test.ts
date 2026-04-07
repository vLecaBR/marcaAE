import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildAvailableWindows } from "@/lib/scheduling/availability"
import { addDays, subDays } from "date-fns"
import type { ScheduleData } from "@/lib/scheduling/types"

describe("Scheduling Availability - buildAvailableWindows", () => {
  const baseSchedule: ScheduleData = {
    timeZone: "America/Sao_Paulo",
    availabilities: [
      {
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "18:00",
      },
      {
        dayOfWeek: 2, // Tuesday
        startTime: "10:00",
        endTime: "15:00",
      },
    ],
    exceptions: [],
  }

  it("deve retornar vazio se não houver dias entre dateFrom e dateTo", () => {
    const today = new Date("2024-01-01T12:00:00Z") // 2024-01-01 is Monday
    const result = buildAvailableWindows(baseSchedule, today, subDays(today, 1))
    expect(result).toHaveLength(0)
  })

  it("deve construir janelas de disponibilidade normais baseadas nos availabilities", () => {
    // 2024-01-01 is Monday, 2024-01-02 is Tuesday. Use Noon UTC to avoid local timezone shifts changing the day 
    const monday = new Date("2024-01-01T12:00:00Z")
    const tuesday = new Date("2024-01-02T12:00:00Z")

    const result = buildAvailableWindows(baseSchedule, monday, tuesday)

    expect(result).toHaveLength(2)

    expect(result[0].dayOfWeek).toBe(1)
    expect(result[0].windows).toHaveLength(1)
    // 09:00 in BRT is 12:00 UTC (during winter time)
    expect(result[0].windows[0].start.toISOString()).toContain("T12:00:00.000Z")
    expect(result[0].windows[0].end.toISOString()).toContain("T21:00:00.000Z")

    expect(result[1].dayOfWeek).toBe(2)
    expect(result[1].windows).toHaveLength(1)
    expect(result[1].windows[0].start.toISOString()).toContain("T13:00:00.000Z")
    expect(result[1].windows[0].end.toISOString()).toContain("T18:00:00.000Z")
  })

  it("deve ignorar dias sem disponibilidade (ex: quarta-feira)", () => {
    const wednesday = new Date("2024-01-03T12:00:00Z") // Wednesday
    const result = buildAvailableWindows(baseSchedule, wednesday, wednesday)
    expect(result).toHaveLength(0)
  })

  it("deve ignorar dias que têm bloqueio completo (fullDayBlock)", () => {
    const monday = new Date("2024-01-01T12:00:00Z") // Monday
    const scheduleWithFullBlock: ScheduleData = {
      ...baseSchedule,
      exceptions: [
        {
          date: monday,
          type: "BLOCKED",
          startTime: null,
          endTime: null,
        }
      ]
    }

    const result = buildAvailableWindows(scheduleWithFullBlock, monday, monday)
    expect(result).toHaveLength(0)
  })

  it("deve fragmentar a janela quando há bloqueio parcial", () => {
    const monday = new Date("2024-01-01T12:00:00Z") // Monday
    const scheduleWithPartialBlock: ScheduleData = {
      ...baseSchedule,
      exceptions: [
        {
          date: monday,
          type: "BLOCKED",
          startTime: "12:00",
          endTime: "13:00",
        }
      ]
    }

    const result = buildAvailableWindows(scheduleWithPartialBlock, monday, monday)

    // A janela original era 09:00 - 18:00
    // Com o bloqueio de 12:00 - 13:00, deve virar duas: 09:00-12:00 e 13:00-18:00
    expect(result).toHaveLength(1)
    expect(result[0].windows).toHaveLength(2)

    // BRT -> UTC conversion checks
    expect(result[0].windows[0].start.toISOString()).toContain("T12:00:00.000Z") // 09:00 BRT
    expect(result[0].windows[0].end.toISOString()).toContain("T15:00:00.000Z") // 12:00 BRT
    
    expect(result[0].windows[1].start.toISOString()).toContain("T16:00:00.000Z") // 13:00 BRT
    expect(result[0].windows[1].end.toISOString()).toContain("T21:00:00.000Z") // 18:00 BRT
  })

  it("deve substituir a janela quando for do tipo OVERRIDE", () => {
    const monday = new Date("2024-01-01T12:00:00Z") // Monday
    const scheduleWithOverride: ScheduleData = {
      ...baseSchedule,
      exceptions: [
        {
          date: monday,
          type: "OVERRIDE",
          startTime: "14:00",
          endTime: "16:00",
        }
      ]
    }

    const result = buildAvailableWindows(scheduleWithOverride, monday, monday)

    // Override substitui totalmente a disponibilidade do dia (que era 09-18)
    expect(result).toHaveLength(1)
    expect(result[0].windows).toHaveLength(1)

    expect(result[0].windows[0].start.toISOString()).toContain("T17:00:00.000Z") // 14:00 BRT
    expect(result[0].windows[0].end.toISOString()).toContain("T19:00:00.000Z") // 16:00 BRT
  })
})