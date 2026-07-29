"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle, Loader2, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

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
      const valorTotal = Number(venda.value || venda.total_value || 0)
      const res = await fetch("/api/financeiro/vendas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origem_ref: venda.id,
          tipo_venda: "servico",
          cliente_firebase_id: venda.client_id ?? "",
          cliente_nome: venda.client_name ?? venda.clientName ?? "",
          descricao: venda.project_name ?? venda.projectName ?? "Venda importada",
          valor_total: valorTotal,
          data_competencia: venda.approved_at
            ? new Date(venda.approved_at.seconds * 1000).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
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
                    {v.project_name ?? v.projectName ?? "Projeto sem nome"}
                  </CardTitle>
                  <CardDescription>
                    {v.client_name ?? v.clientName ?? "Cliente não informado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Aprovado em{" "}
                    {v.approved_at
                      ? formatDate(new Date(v.approved_at.seconds * 1000))
                      : "-"}
                  </span>
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
