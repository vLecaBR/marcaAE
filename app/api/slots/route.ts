import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildAvailableWindows } from "@/lib/scheduling/availability"
import { computeAvailableSlots, groupSlotsByDate } from "@/lib/scheduling/slots"
import { startOfDay, endOfDay, addDays, subDays, parseISO } from "date-fns"
import type { ScheduleData } from "@/lib/scheduling/types"
import { getGoogleCalendarBusySlots } from "@/lib/google/calendar"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ownerId     = searchParams.get("ownerId")
  const eventTypeId = searchParams.get("eventTypeId")
  const dateStr     = searchParams.get("date")
  const tz          = searchParams.get("tz") ?? "UTC"

  if (!ownerId || !eventTypeId || !dateStr) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
  }

  try {
    const dateFrom = startOfDay(subDays(parseISO(dateStr), 1))
    // Verificamos de D-1 até D+1 para garantir cobertura de fuso horário
    const dateTo   = endOfDay(addDays(parseISO(dateStr), 1))

    const [eventType, schedule, existingBookings, googleBusySlots] = await Promise.all([
      prisma.eventType.findFirst({
        where: { id: eventTypeId, userId: ownerId, isActive: true },
        select: {
          duration: true, beforeEventBuffer: true,
          afterEventBuffer: true, bookingLimitDays: true,
        },
      }),
      prisma.schedule.findFirst({
        where: { userId: ownerId, isDefault: true },
        include: { availabilities: true, exceptions: true },
      }),
      prisma.booking.findMany({
        where: {
          userId: ownerId,
          status: { in: ["CONFIRMED", "PENDING"] },
          startTime: { lt: dateTo },
          endTime:   { gt: dateFrom },
        },
        select: { startTime: true, endTime: true },
      }),
      getGoogleCalendarBusySlots(ownerId, dateFrom, dateTo),
    ])

    if (!eventType || !schedule) {
      return NextResponse.json({ error: "Não encontrado." }, { status: 404 })
    }

    const scheduleData: ScheduleData = {
      timeZone: schedule.timeZone,
      availabilities: schedule.availabilities,
      exceptions: schedule.exceptions.map((ex: any) => ({
        ...ex,
        type: ex.type as "BLOCKED" | "VACATION" | "OVERRIDE",
      })),
    }

    // Unir agendamentos internos com conflitos do Google Calendar
    const combinedConflicts = [
      ...existingBookings,
      ...googleBusySlots.map((slot: any) => ({
        startTime: slot.start,
        endTime: slot.end,
      })),
    ]

    const windows = buildAvailableWindows(scheduleData, dateFrom, dateTo)
    const slots   = computeAvailableSlots(windows, combinedConflicts, {
      userId: ownerId,
      eventDuration: eventType.duration,
      beforeBuffer:  eventType.beforeEventBuffer,
      afterBuffer:   eventType.afterEventBuffer,
      dateFrom,
      dateTo,
      viewerTimeZone: tz,
    })

    const grouped = groupSlotsByDate(slots, tz)
    const daySlots = grouped[dateStr] ?? []

    return NextResponse.json({ slots: daySlots })
  } catch (err) {
    console.error("[GET /api/slots]", err)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}