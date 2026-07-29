"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AGING_BUCKET_LABEL, AGING_BUCKET_ORDER } from "@/lib/financeiro-labels"
import { useFinanceiroCadastros } from "@/hooks/use-financeiro-cadastros"

type AgingItem = {
  parcela_id: number
  titulo_id: number
  descricao: string
  cliente_nome: string | null
  fornecedor_id: number | null
  numero: number
  valor_pendente: number
  data_vencimento: string
  dias_atraso: number
  bucket: string
}

type AgingGroup = {
  buckets: Record<string, { quantidade: number; total: number }>
  itens: AgingItem[]
}

type Inadimplencia = { receber: AgingGroup; pagar: AgingGroup }

const BUCKET_VARIANT: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  a_vencer: "outline",
  atrasado_1_30: "secondary",
  atrasado_31_60: "default",
  atrasado_61_90: "destructive",
  atrasado_90_mais: "destructive",
}

function AgingSection({
  title,
  group,
  nomeParte,
}: {
  title: string
  group: AgingGroup | undefined
  nomeParte: (item: AgingItem) => string
}) {
  const itens = group?.itens ?? []
  const totalGeral = itens.reduce((s, i) => s + i.valor_pendente, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">{formatCurrency(totalGeral)} em aberto</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {AGING_BUCKET_ORDER.map((b) => {
            const info = group?.buckets?.[b]
            return (
              <Badge key={b} variant={BUCKET_VARIANT[b] ?? "outline"} className="text-xs">
                {AGING_BUCKET_LABEL[b]}: {info ? `${info.quantidade} · ${formatCurrency(info.total)}` : "—"}
              </Badge>
            )
          })}
        </div>

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pendência.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 pr-4 font-medium">Descrição</th>
                  <th className="pb-2 pr-4 font-medium">Cliente/Fornecedor</th>
                  <th className="pb-2 pr-4 font-medium">Vencimento</th>
                  <th className="pb-2 pr-4 font-medium">Atraso</th>
                  <th className="pb-2 pr-4 font-medium">Valor Pendente</th>
                  <th className="pb-2 font-medium">Faixa</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.parcela_id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-4">{item.descricao} <span className="text-muted-foreground">#{item.numero}</span></td>
                    <td className="py-2 pr-4 text-muted-foreground">{nomeParte(item)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(item.data_vencimento)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {item.dias_atraso > 0 ? `${item.dias_atraso} dias` : "a vencer"}
                    </td>
                    <td className="py-2 pr-4 font-medium">{formatCurrency(item.valor_pendente)}</td>
                    <td className="py-2">
                      <Badge variant={BUCKET_VARIANT[item.bucket] ?? "outline"} className="text-xs">
                        {AGING_BUCKET_LABEL[item.bucket] ?? item.bucket}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function InadimplenciaPage() {
  const { fornecedores } = useFinanceiroCadastros()
  const [data, setData] = useState<Inadimplencia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/financeiro/relatorios/inadimplencia", { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar inadimplência")
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nomeFornecedor = (id: number | null) => fornecedores.find((f) => f.id === id)?.nome ?? "-"

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Inadimplência</h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      <div className="page-detail-content space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando…
          </div>
        ) : (
          <>
            <AgingSection
              title="A Receber"
              group={data?.receber}
              nomeParte={(item) => item.cliente_nome ?? "-"}
            />
            <AgingSection
              title="A Pagar"
              group={data?.pagar}
              nomeParte={(item) => nomeFornecedor(item.fornecedor_id)}
            />
          </>
        )}
      </div>
    </div>
  )
}
