import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AvailabilityForm } from "@/components/settings/availability-form"
import { ExceptionsManager } from "@/components/settings/exceptions/exceptions-manager"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Disponibilidade | MarcaAí" }

export default async function AvailabilityPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let schedule = await prisma.schedule.findFirst({
    where: { userId: session.user.id },
    include: { 
      availabilities: true,
      exceptions: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" }
      }
    },
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
      include: { availabilities: true, exceptions: true },
    })
  }

  return (
    <div className="space-y-12 pb-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Disponibilidade</h1>
        <p className="mt-2 text-zinc-400">
          Configure seus dias e horários de trabalho.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-semibold text-white">Horários Fixos</h2>
          <p className="text-sm text-zinc-400 mt-1">Sua semana de trabalho padrão, incluindo pausas para almoço.</p>
        </div>
        <AvailabilityForm schedule={schedule} />
      </div>

      <div className="space-y-6 pt-6">
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-semibold text-white">Férias e Exceções</h2>
          <p className="text-sm text-zinc-400 mt-1">Dias específicos em que você NÃO estará disponível.</p>
        </div>
        <ExceptionsManager scheduleId={schedule.id} exceptions={schedule.exceptions} />
      </div>
    </div>
  )
}
