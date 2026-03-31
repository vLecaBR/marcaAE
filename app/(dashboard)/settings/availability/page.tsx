import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AvailabilityForm } from "@/components/settings/availability-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Disponibilidade | Settings" }

export default async function AvailabilityPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let schedule = await prisma.schedule.findFirst({
    where: { userId: session.user.id },
    include: { availabilities: true },
  })

  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: {
        userId: session.user.id,
        name: "Agenda Padrão",
        timeZone: "America/Sao_Paulo",
        isDefault: true,
        availabilities: {
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: "09:00",
            endTime: "18:00",
          })),
        },
      },
      include: { availabilities: true },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Disponibilidade</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure seus dias e horários de trabalho padrão.
        </p>
      </div>
      <AvailabilityForm schedule={schedule} />
    </div>
  )
}
