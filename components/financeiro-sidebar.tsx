"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  BarChart3,
  Building2,
  FileBarChart,
  Home,
  RefreshCcw,
  Repeat,
  ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export const financeiroNavItems: {
  href: string
  label: string
  icon: typeof Home
  exact?: boolean
}[] = [
  { href: "/", label: "Dashboard", icon: Home, exact: true },
  { href: "/contas-a-receber", label: "Contas a Receber", icon: ArrowDownCircle },
  { href: "/contas-a-pagar", label: "Contas a Pagar", icon: ArrowUpCircle },
  { href: "/recorrencias", label: "Recorrências", icon: Repeat },
  { href: "/vendas", label: "Importar Vendas", icon: ShoppingBag },
  { href: "/conciliacao", label: "Conciliação OFX", icon: RefreshCcw },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: BarChart3 },
  { href: "/dre", label: "DRE", icon: FileBarChart },
  { href: "/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
  { href: "/cadastros", label: "Cadastros", icon: Building2 },
]

export function isFinanceiroNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type FinanceiroNavProps = {
  onNavigate?: () => void
  className?: string
}

export function FinanceiroNav({ onNavigate, className }: FinanceiroNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1", className)}>
      {financeiroNavItems.map(({ href, label, icon: Icon, exact }) => (
        <Button
          key={href}
          variant={isFinanceiroNavActive(pathname, href, exact) ? "secondary" : "ghost"}
          className="w-full justify-start min-h-11 text-base md:text-sm md:min-h-10"
          asChild
          onClick={onNavigate}
        >
          <Link href={href}>
            <Icon className="mr-2 h-5 w-5 shrink-0 md:h-4 md:w-4" />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}

export function FinanceiroSidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn(
        "hidden md:flex pb-12 border-r h-full w-[250px] shrink-0 flex-col",
        className,
      )}
    >
      <div className="flex-1">
        <div className="px-4 py-4 border-b">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-water.svg" alt="Water Design" className="h-5 w-auto" />
        </div>
        <div className="space-y-4 py-4">
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 mb-2 px-2">
              <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold tracking-tight">Financeiro</h2>
            </div>
            <p className="mb-3 px-2 text-xs text-muted-foreground">Gestão financeira</p>
            <FinanceiroNav />
          </div>
        </div>
      </div>
    </aside>
  )
}
