import type { Metadata } from "next"
import { AvailabilityForm } from "@/components/settings/availability-form"
import { ExceptionsManager } from "@/components/settings/exceptions/exceptions-manager"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { Card } from "@/components/ui/card"
import type { ScheduleDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Disponibilidade" }

/**
 * Disponibilidade — via API .NET (`GET /schedules`). Usa a agenda padrão do profissional.
 */
export default async function AvailabilityPage() {
  await requireOnboarded()

  const schedules = await serverApiFetch<ScheduleDto[]>(endpoints.schedules.root).catch(
    () => [] as ScheduleDto[],
  )
  const schedule = schedules.find((s) => s.isDefault) ?? schedules[0]

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Disponibilidade</h1>
        <p className="text-muted-foreground mt-1">
          Defina quando você está livre para atender seus pacientes.
        </p>
      </div>

      {!schedule ? (
        <Card className="rounded-2xl border-border/60 p-8 text-center text-sm text-muted-foreground shadow-sm">
          Nenhuma agenda encontrada. Ela é criada automaticamente no seu primeiro acesso — recarregue
          em instantes.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <AvailabilityForm
              schedule={{
                id: schedule.id,
                timeZone: schedule.timeZone,
                availabilities: schedule.availabilities,
              }}
            />
          </div>
          <div className="h-fit">
            <ExceptionsManager scheduleId={schedule.id} exceptions={schedule.exceptions as never} />
          </div>
        </div>
      )}
    </div>
  )
}
