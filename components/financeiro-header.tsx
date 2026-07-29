"use client"

import { useEffect, useState } from "react"
import { LogOut, Menu, UserCog } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFinanceiroNav } from "@/components/financeiro-nav-context"
import { WATER_DESIGN_URL } from "@/constants"

function getInitials(nome: string) {
  if (!nome) return "?"
  return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function FinanceiroHeader() {
  const { openMobileNav } = useFinanceiroNav()
  const [loggedUser, setLoggedUser] = useState<{
    full_name?: string
    email?: string
    photo_url?: string
    position?: string
  } | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLoggedUser(data))
      .catch(() => {})
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-6 bg-background">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11 shrink-0"
          onClick={openMobileNav}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Financeiro</p>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            Water Design — gestão financeira
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-11 min-h-11 py-1.5 px-2 shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={loggedUser?.photo_url || undefined} alt={loggedUser?.full_name} />
              <AvatarFallback>{getInitials(loggedUser?.full_name || "")}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left max-w-[140px]">
              <p className="text-sm font-medium leading-none truncate">{loggedUser?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{loggedUser?.position || "Financeiro"}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { window.location.href = `${WATER_DESIGN_URL}/app-selector` }} className="min-h-11">
            <UserCog className="mr-2 h-4 w-4" />
            Alternar área
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { window.location.href = `${WATER_DESIGN_URL}/logout` }} className="min-h-11">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
