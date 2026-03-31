"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cancelBooking } from "@/lib/actions/booking"
import { sendBookingConfirmedEmail } from "@/lib/email/send"
import { sendWhatsAppConfirmation } from "@/lib/whatsapp/send"
import { APP_URL } from "@/lib/email/resend"

export async function approveBookingAction(uid: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }

  const booking = await prisma.booking.findUnique({
    where: { uid },
    include: {
      eventType: {
        select: {
          title: true,
          locationType: true,
          locationValue: true,
          user: { select: { name: true, email: true, timeZone: true } },
        },
      },
    },
  })

  if (!booking || booking.userId !== session.user.id) {
    return { success: false, error: "Agendamento não encontrado ou sem permissão" }
  }

  await prisma.booking.update({
    where: { uid },
    data: { status: "CONFIRMED" },
  })

  // Emails and WhatsApp
  const emailData = {
    uid: booking.uid,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    ownerName: booking.eventType.user.name ?? "Organizador",
    ownerEmail: booking.eventType.user.email,
    eventTitle: booking.eventType.title,
    startTime: booking.startTime,
    endTime: booking.endTime,
    guestTimeZone: booking.guestTimeZone,
    ownerTimeZone: booking.eventType.user.timeZone,
    locationType: booking.eventType.locationType,
    meetingUrl: booking.eventType.locationValue ?? null,
    requiresConfirm: false,
  }

  void sendBookingConfirmedEmail(emailData).catch(err => console.error("[email approve dispatch]", err))

  if (booking.guestPhone) {
    void sendWhatsAppConfirmation({
      phone: booking.guestPhone,
      guestName: booking.guestName,
      eventTitle: booking.eventType.title,
      ownerName: booking.eventType.user.name ?? "Organizador",
      startTime: booking.startTime,
      appUrl: APP_URL,
      uid: booking.uid,
    }).catch(err => console.error("[whatsapp approve dispatch]", err))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/bookings")

  return { success: true }
}

export async function rejectBookingAction(uid: string, reason: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }

  const booking = await prisma.booking.findUnique({
    where: { uid },
    select: { userId: true },
  })

  if (!booking || booking.userId !== session.user.id) {
    return { success: false, error: "Agendamento não encontrado ou sem permissão" }
  }

  const result = await cancelBooking(uid, reason, "OWNER")

  if (result.status === "success") {
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/bookings")
    return { success: true }
  }

  return { success: false, error: result.message ?? "Erro ao rejeitar" }
}
