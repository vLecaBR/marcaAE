"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Sub-navegação da clínica (Equipe · Financeiro). A aba Financeiro só é renderizada para quem pode
 * ver o faturamento dos colegas (OWNER/ADMIN) — RBAC também é enforçado na página e no backend.
 */
export function ClinicTabs({ canSeeFinance }: { canSeeFinance: boolean }) {
  const pathname = usePathname()

  const tabs = [
    { href: "/dashboard/team", label: "Equipe", icon: Users, show: true },
    { href: "/dashboard/team/financeiro", label: "Financeiro", icon: BarChart3, show: canSeeFinance },
  ].filter((t) => t.show)

  return (
    <nav className="flex gap-1 border-b border-border/60" aria-label="Seções da clínica">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              active
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
