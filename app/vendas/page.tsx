"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle, Loader2, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

function toDate(timestamp: any): Date | null {
  const seconds = timestamp?._seconds ?? timestamp?.seconds
  return typeof seconds === "number" ? new Date(seconds * 1000) : null
}

function proposalTitle(v: any): string {
  if (!v.order_number) return "Proposta sem número"
  return `Proposta #${v.order_number}${v.revision_number ? ` - REV ${v.revision_number}` : ""}`
}

export default function VendasPage() {
  const { toast } = useToast()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/financeiro/vendas/aprovadas", { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar vendas")
      setVendas(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const importar = async (venda: any) => {
    setImporting(venda.id)
    try {
      const valorTotal = Number(venda.paymentInfo?.total_value || 0)
      const clienteNome = venda.client_data?.client?.full_name ?? ""
      const aprovadoEm = toDate(venda.approved_at)
      const res = await fetch("/api/financeiro/vendas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origem_ref: venda.id,
          tipo_venda: "servico",
          cliente_firebase_id: venda.client_data?.client?.id ?? "",
          cliente_nome: clienteNome,
          descricao: `${proposalTitle(venda)}${clienteNome ? ` — ${clienteNome}` : ""}`,
          valor_total: valorTotal,
          data_competencia: (aprovadoEm ?? new Date()).toISOString().slice(0, 10),
          parcelas: [
            { valor: valorTotal, data_vencimento: new Date().toISOString().slice(0, 10) },
          ],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? "Erro ao importar")
      }
      toast({ title: "Venda importada com sucesso!" })
      load()
    } catch (e) {
      toast({
        title: "Erro ao importar venda",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Importar Vendas Aprovadas</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Orçamentos aprovados no Comercial ainda não lançados como contas a receber
        </p>
      </div>

      <div className="page-detail-content">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando vendas aprovadas…
          </div>
        ) : vendas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
            <p className="text-sm">Todas as vendas aprovadas já foram importadas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendas.map((v) => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {proposalTitle(v)}
                  </CardTitle>
                  <CardDescription>
                    {v.client_data?.client?.full_name ?? "Cliente não informado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-emerald-600">
                      {formatCurrency(v.paymentInfo?.total_value ?? 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Aprovado em {toDate(v.approved_at) ? formatDate(toDate(v.approved_at)!) : "-"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => importar(v)}
                    disabled={importing === v.id}
                  >
                    {importing === v.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Importar"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
