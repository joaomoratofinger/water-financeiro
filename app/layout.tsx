import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { FinanceiroShell } from "@/components/financeiro-shell"
import { Toaster } from "@/components/ui/toaster"

const dmSans = DM_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Water Design — Financeiro",
  description: "Gestão financeira",
  icons: { icon: "/favicon.ico" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={dmSans.className}>
        <FinanceiroShell>{children}</FinanceiroShell>
        <Toaster />
      </body>
    </html>
  )
}
