"use client"

import { createContext, useContext } from "react"

type FinanceiroNavContextValue = {
  openMobileNav: () => void
}

export const FinanceiroNavContext = createContext<FinanceiroNavContextValue>({
  openMobileNav: () => {},
})

export function useFinanceiroNav() {
  return useContext(FinanceiroNavContext)
}
