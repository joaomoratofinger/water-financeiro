"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/utils"
import { startOfMonth, endOfMonth, format } from "date-fns"

type FluxoItem = { data: string; entradas: number; saidas: number }

function FluxoTable({ itens, loading, emptyMessage }: { itens: FluxoItem[]; loading: boolean; emptyMessage: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    )
  }
  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-left">
            <th className="pb-2 pr-4 font-medium">Data</th>
            <th className="pb-2 pr-4 font-medium text-emerald-600">Entradas</th>
            <th className="pb-2 pr-4 font-medium text-red-600">Saídas</th>
            <th className="pb-2 font-medium">Saldo dia</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => {
            const saldoDia = Number(item.entradas) - Number(item.saidas)
            return (
              <tr key={item.data} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2 pr-4">{formatDate(item.data)}</td>
                <td className="py-2 pr-4 text-emerald-600">{formatCurrency(item.entradas)}</td>
                <td className="py-2 pr-4 text-red-600">{formatCurrency(item.saidas)}</td>
                <td className={`py-2 font-medium ${saldoDia >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(saldoDia)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function FluxoCaixaPage() {
  const hoje = new Date()
  const [inicio, setInicio] = useState(format(startOfMonth(hoje), "yyyy-MM-dd"))
  const [fim, setFim] = useState(format(endOfMonth(hoje), "yyyy-MM-dd"))
  const [itens, setItens] = useState<FluxoItem[]>([])
  const [itensPrevistos, setItensPrevistos] = useState<FluxoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!inicio || !fim) return
    setLoading(true)
    setError(null)
    try {
      const [realizadoRes, previstoRes] = await Promise.all([
        fetch(`/api/financeiro/fluxo-caixa?inicio=${inicio}&fim=${fim}`, { cache: "no-store" }),
        fetch(`/api/financeiro/relatorios/fluxo-caixa-projetado?inicio=${inicio}&fim=${fim}`, { cache: "no-store" }),
      ])
      if (!realizadoRes.ok) throw new Error("Erro ao carregar fluxo de caixa")
      setItens(await realizadoRes.json())
      setItensPrevistos(previstoRes.ok ? await previstoRes.json() : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => { load() }, [load])

  const totalEntradas = itens.reduce((s, i) => s + Number(i.entradas), 0)
  const totalSaidas = itens.reduce((s, i) => s + Number(i.saidas), 0)
  const saldoRealizado = totalEntradas - totalSaidas

  const totalEntradasPrevistas = itensPrevistos.reduce((s, i) => s + Number(i.entradas), 0)
  const totalSaidasPrevistas = itensPrevistos.reduce((s, i) => s + Number(i.saidas), 0)
  const saldoPrevisto = totalEntradasPrevistas - totalSaidasPrevistas

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Fluxo de Caixa</h1>
        </div>
      </div>

      <div className="page-detail-content space-y-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="inicio">Início</Label>
            <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fim">Fim</Label>
            <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filtrar"}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">Saldo Realizado</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${saldoRealizado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(saldoRealizado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalEntradas)} entradas — {formatCurrency(totalSaidas)} saídas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">Saldo Projetado (Realizado + Previsto)</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${saldoRealizado + saldoPrevisto >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(saldoRealizado + saldoPrevisto)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalEntradasPrevistas)} a receber — {formatCurrency(totalSaidasPrevistas)} a pagar (títulos em aberto)
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Realizado — movimentações efetivadas por dia</CardTitle></CardHeader>
          <CardContent>
            <FluxoTable itens={itens} loading={loading} emptyMessage="Nenhuma movimentação no período selecionado." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previsto — títulos em aberto por vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            <FluxoTable itens={itensPrevistos} loading={loading} emptyMessage="Nenhum título em aberto vencendo no período." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
