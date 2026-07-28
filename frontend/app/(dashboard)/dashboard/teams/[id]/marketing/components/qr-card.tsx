"use client"

import { QRCodeSVG } from "qrcode.react"
import { Printer } from "lucide-react"

interface QrCardProps {
  teamName: string
  url: string
  isPrintView?: boolean
}

export function QrCard({ teamName, url, isPrintView = false }: QrCardProps) {
  function handlePrint() {
    window.print()
  }

  if (isPrintView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white text-[#1b2a34] w-[210mm] min-h-[297mm]">
        <h1 className="text-4xl font-bold mb-4">{teamName}</h1>
        <p className="text-xl text-[#5b6b72] mb-12">Escaneie o código abaixo para agendar seu horário!</p>

        <div className="p-8 border-4 border-brand-primary rounded-3xl bg-white shadow-xl mb-12">
          <QRCodeSVG 
            value={url}
            size={400}
            bgColor="#ffffff"
            fgColor="#1b2a34"
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-2xl font-medium tracking-tight">
          Ou acesse: <span className="font-bold">{url.replace("https://", "").replace("http://", "")}</span>
        </p>
        
        <div className="mt-auto pt-24 opacity-50">
          <p className="text-sm font-semibold">Powered by MarcaAí</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-4 rounded-xl mb-6 border border-border/60">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#1b2a34"
          level="H"
          includeMargin={false}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        Aponte a câmera do celular para este código para acessar a página <span className="text-foreground font-medium">{teamName}</span>.
      </p>

      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99]"
      >
        <Printer className="h-4 w-4" />
        Imprimir Cartaz
      </button>
    </div>
  )
}
