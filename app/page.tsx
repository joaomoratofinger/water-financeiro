"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  Loader2,
  RefreshCcw,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type DashboardData = {
  totalAReceber: number
  totalAPagar: number
  saldoRealizado: number
  titulosAReceber: number
  titulosAPagar: number
}

export default function FinanceiroDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/financeiro/dashboard", { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar dashboard")
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-6 w-6 text-emerald-600 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard Financeiro</h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="page-detail-content">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Tentar novamente</Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando dados financeiros…
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">A Receber</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(data.totalAReceber)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.titulosAReceber} título{data.titulosAReceber !== 1 ? "s" : ""} em aberto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.totalAPagar)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.titulosAPagar} título{data.titulosAPagar !== 1 ? "s" : ""} em aberto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Saldo Realizado</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.saldoRealizado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(data.saldoRealizado)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entradas – saídas efetivadas
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
