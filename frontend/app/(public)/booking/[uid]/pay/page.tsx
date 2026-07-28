import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { PaymentClient } from "@/components/payment/payment-client"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import { isApiError } from "@/lib/api/problem-details"
import type { BookingDetailDto } from "@/lib/api/booking-types"

export const metadata: Metadata = { title: "Pagamento da consulta" }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

/**
 * Checkout do paciente (spec §3.3). Paleta Teal institucional — pagamento transmite segurança,
 * então não usamos a cor de marca do profissional aqui. Se já estiver pago, vai para a confirmação.
 */
export default async function PayPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params

  let booking: BookingDetailDto
  try {
    booking = await serverApiFetch<BookingDetailDto>(endpoints.bookings.byUid(uid))
  } catch (err) {
    if (isApiError(err) && err.kind === "not_found") notFound()
    throw err
  }

  if (booking.paymentStatus === "PAID") redirect(`/booking/${uid}`)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="px-6 py-5 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><Logo size={24} /></Link>
          <Link href={`/booking/${uid}`} className="text-xs text-muted-foreground hover:text-foreground">
            Detalhes do agendamento
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <PaymentClient
          uid={uid}
          eventTitle={booking.eventTitle}
          ownerName={booking.ownerName}
          returnUrl={`${APP_URL}/booking/${uid}`}
        />
      </main>
    </div>
  )
}
