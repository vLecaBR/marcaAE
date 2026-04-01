import { Payment, MercadoPagoConfig } from "mercadopago"

export interface CreatePixInput {
  transactionAmount: number
  description: string
  payerEmail: string
  payerFirstName: string
  externalReference: string
}

export async function createPixPayment(input: CreatePixInput) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    console.error("[MercadoPago] Missing MERCADOPAGO_ACCESS_TOKEN in env")
    return null
  }

  const client = new MercadoPagoConfig({ accessToken: token })
  const payment = new Payment(client)

  try {
    const result = await payment.create({
      body: {
        transaction_amount: input.transactionAmount,
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: input.payerEmail,
          first_name: input.payerFirstName,
        },
        external_reference: input.externalReference,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      }
    })

    const data = result.point_of_interaction?.transaction_data

    return {
      id: result.id?.toString(),
      qrCodeBase64: data?.qr_code_base64,
      qrCode: data?.qr_code,
      ticketUrl: data?.ticket_url,
    }
  } catch (error) {
    console.error("[MercadoPago] Error creating PIX", error)
    return null
  }
}
