"use client"

import { useCallback, useEffect, useState } from "react"
import { FileBarChart, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { GRUPO_DRE_OPTIONS } from "@/lib/financeiro-labels"
import { startOfMonth, endOfMonth, format } from "date-fns"

const SUBTOTAL_GRUPOS = new Set(["receita_liquida", "lucro_bruto"])

type DreData = {
  periodo: { inicio: string; fim: string }
  grupos: { grupo: string; total: number }[]
  totalReceitas: number
  totalDespesas: number
  resultado: number
}

export default function DrePage() {
  const hoje = new Date()
  const [inicio, setInicio] = useState(format(startOfMonth(hoje), "yyyy-MM-dd"))
  const [fim, setFim] = useState(format(endOfMonth(hoje), "yyyy-MM-dd"))
  const [data, setData] = useState<DreData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!inicio || !fim) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/financeiro/relatorios/dre?inicio=${inicio}&fim=${fim}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar DRE")
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">DRE — Demonstrativo de Resultado</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Baseado na data de competência dos títulos, agrupado pelo Grupo DRE de cada categoria.
        </p>
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

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Total Receitas</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-emerald-600">{formatCurrency(data.totalReceitas)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Total Despesas</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-red-600">{formatCurrency(data.totalDespesas)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Resultado do Período</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${data.resultado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(data.resultado)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Resultado por Grupo</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : !data ? (
              <p className="text-sm text-muted-foreground text-center py-8">Selecione um período.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.grupos.map((g) => {
                    const label = GRUPO_DRE_OPTIONS.find((o) => o.value === g.grupo)?.label ?? g.grupo
                    const isSubtotal = SUBTOTAL_GRUPOS.has(g.grupo)
                    return (
                      <tr key={g.grupo} className={`border-b last:border-0 ${isSubtotal ? "font-semibold bg-muted/30" : ""}`}>
                        <td className="py-2 pr-4">{label}</td>
                        <td className={`py-2 text-right ${g.total < 0 ? "text-red-600" : g.total > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {formatCurrency(g.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
