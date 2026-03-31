"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cancelBooking } from "@/lib/actions/booking"

export async function approveBookingAction(uid: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }

  const booking = await prisma.booking.findUnique({
    where: { uid },
    select: { userId: true },
  })

  if (!booking || booking.userId !== session.user.id) {
    return { success: false, error: "Agendamento não encontrado ou sem permissão" }
  }

  await prisma.booking.update({
    where: { uid },
    data: { status: "CONFIRMED" },
  })

  // IDEALMENTE: Enviar email de confirmação aqui.

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
