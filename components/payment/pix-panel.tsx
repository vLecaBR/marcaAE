"use client"

/**
 * Painel de pagamento PIX (Mercado Pago). Exibe o QR Code e o "copia e cola" retornados pela API
 * (spec §3.3). O status é confirmado por polling no componente pai (usePaymentStatus).
 */

import { useState } from "react"
import { toast } from "sonner"
import { Copy, Check, QrCode, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PixPanel({
  qrCodeBase64,
  qrCode,
  ticketUrl,
}: {
  qrCodeBase64?: string | null
  qrCode?: string | null
  ticketUrl?: string | null
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    if (!qrCode) return
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    toast.success("Código PIX copiado.")
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-brand-primary">
        <QrCode size={22} />
      </div>
      <h3 className="mt-3 text-base font-semibold">Pague com PIX para confirmar</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Escaneie o QR Code no app do seu banco ou copie o código. A confirmação é automática.
      </p>

      {qrCodeBase64 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code PIX" className="h-52 w-52" />
        </div>
      ) : null}

      {qrCode ? (
        <div className="mt-6 w-full">
          <p className="mb-1.5 text-left text-xs font-medium text-muted-foreground">PIX copia e cola</p>
          <div className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1 truncate rounded-xl border border-input bg-muted/40 px-3 py-3 text-left font-mono text-xs">
              {qrCode}
            </div>
            <Button
              type="button"
              onClick={copy}
              className="h-auto shrink-0 rounded-xl px-4"
              style={{ background: "var(--brand, #0f9e8e)" }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>
      ) : null}

      {ticketUrl ? (
        <a
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline"
        >
          Abrir no Mercado Pago <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
  )
}
