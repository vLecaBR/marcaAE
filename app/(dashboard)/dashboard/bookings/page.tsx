import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Agendamentos" }

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { startTime: "desc" },
    include: {
      eventType: {
        select: { title: true, color: true },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Agendamentos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Visualize e gerencie todos os seus horários marcados.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm text-zinc-500">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-4 sm:p-5 hover:bg-zinc-900/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      {booking.guestName}
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          booking.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400" :
                          booking.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                          "bg-rose-500/10 text-rose-400"
                        )}
                      >
                        {booking.status}
                      </span>
                    </p>
                    <p className="text-sm text-zinc-400">
                      {booking.eventType.title} • {booking.guestEmail}
                    </p>
                  </div>
                  
                  <div className="text-left sm:text-right text-sm">
                    <p className="text-white font-medium">
                      {format(booking.startTime, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-zinc-500">
                      {format(booking.startTime, "HH:mm")} - {format(booking.endTime, "HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
