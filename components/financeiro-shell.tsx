"use client"

import { useMemo, useState, type ReactNode } from "react"
import { FinanceiroHeader } from "@/components/financeiro-header"
import { FinanceiroNav, FinanceiroSidebar } from "@/components/financeiro-sidebar"
import { FinanceiroNavContext } from "@/components/financeiro-nav-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function FinanceiroShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navContext = useMemo(
    () => ({ openMobileNav: () => setMobileNavOpen(true) }),
    [],
  )

  return (
    <FinanceiroNavContext.Provider value={navContext}>
      <div id="financeiro-app-shell" className="flex h-[100dvh] overflow-hidden bg-background">
        <FinanceiroSidebar />

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0 pt-12">
            <SheetHeader className="px-4 pb-2 border-b">
              <SheetTitle>Financeiro</SheetTitle>
              <p className="text-xs text-muted-foreground text-left">Gestão financeira</p>
            </SheetHeader>
            <div className="px-3 py-4">
              <FinanceiroNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <FinanceiroHeader />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[env(safe-area-inset-bottom)]">
            {children}
          </main>
        </div>
      </div>
    </FinanceiroNavContext.Provider>
  )
}
