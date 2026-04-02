"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { stripe, STRIPE_PRO_PRICE_ID } from "@/lib/payments/stripe"

export async function createCheckoutSessionAction(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })

  if (!member || member.role !== "OWNER") {
    return { error: "Apenas o dono da equipe pode assinar planos." }
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { subscription: true },
  })

  if (!team) return { error: "Equipe não encontrada." }

  try {
    // Se já tiver customer ID (já assinou antes), abrimos o portal de cliente
    if (team.subscription && team.subscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: team.subscription.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teams/${teamId}`,
      })

      return { url: stripeSession.url }
    }

    // Cria nova sessão de checkout
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teams/${teamId}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teams/${teamId}/billing?canceled=true`,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price: STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        teamId,
      },
    })

    return { url: stripeSession.url }
  } catch (err) {
    console.error("[Stripe] Error creating checkout", err)
    return { error: "Falha ao gerar o link de pagamento." }
  }
}
