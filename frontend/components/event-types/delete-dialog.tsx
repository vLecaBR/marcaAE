// components/event-types/delete-dialog.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert } from "lucide-react"
import { deleteEventTypeAction } from "@/lib/actions/event-types"
import { MotionModal } from "@/components/motion/modal"
import { Button } from "@/components/ui/button"

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  eventTypeId: string
  eventTypeTitle: string
}

export function DeleteDialog({
  open,
  onClose,
  eventTypeId,
  eventTypeTitle,
}: DeleteDialogProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    const result = await deleteEventTypeAction(eventTypeId)
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error)
      setIsDeleting(false)
    }
  }

  return (
    <MotionModal open={open} onClose={onClose} labelledBy="delete-event-type-title">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="h-5 w-5 text-destructive" />
      </div>

      <h3 id="delete-event-type-title" className="text-base font-semibold text-foreground">
        Excluir tipo de consulta
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Tem certeza que deseja excluir{" "}
        <span className="font-medium text-foreground">&quot;{eventTypeTitle}&quot;</span>?
        Esta ação não pode ser desfeita e todos os agendamentos futuros serão afetados.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1 rounded-xl"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </Button>
      </div>
    </MotionModal>
  )
}
