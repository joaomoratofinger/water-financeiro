"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle, Loader2, RefreshCcw, Upload, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  conciliado: "Conciliado",
  ignorado: "Ignorado",
  lancamento_avulso: "Avulso",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: "default",
  conciliado: "secondary",
  ignorado: "destructive",
  lancamento_avulso: "outline",
}

export default function ConciliacaoPage() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [contaId, setContaId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [conciliando, setConciliando] = useState<number | null>(null)
  const [ignorando, setIgnorando] = useState<number | null>(null)

  const loadTransacoes = useCallback(async () => {
    setLoadingTx(true)
    try {
      const params = new URLSearchParams({ status: "pendente" })
      if (contaId) params.append("contaId", contaId)
      const res = await fetch(`/api/financeiro/conciliacao/transacoes?${params}`, { cache: "no-store" })
      if (!res.ok) throw new Error()
      setTransacoes(await res.json())
    } catch {
      setTransacoes([])
    } finally {
      setLoadingTx(false)
    }
  }, [contaId])

  useEffect(() => { loadTransacoes() }, [loadTransacoes])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast({ title: "Selecione um arquivo OFX", variant: "destructive" }); return }
    if (!contaId) { toast({ title: "Informe o ID da conta bancária", variant: "destructive" }); return }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("contaBancariaId", contaId)
      const res = await fetch("/api/financeiro/conciliacao/importar-ofx", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast({
        title: "Extrato importado",
        description: `${data.novas} novas transações | ${data.duplicadas} ignoradas (já importadas)`,
      })
      if (fileRef.current) fileRef.current.value = ""
      loadTransacoes()
    } catch (e) {
      toast({
        title: "Erro ao importar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleConciliar = async (tx: any) => {
    setConciliando(tx.id)
    try {
      const res = await fetch("/api/financeiro/conciliacao/conciliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_transaction_id: tx.id,
          conta_bancaria_id: tx.conta_bancaria_id,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      toast({ title: "Conciliado como lançamento avulso" })
      loadTransacoes()
    } catch (e) {
      toast({
        title: "Erro ao conciliar",
        description: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      })
    } finally {
      setConciliando(null)
    }
  }

  const handleIgnorar = async (id: number) => {
    setIgnorando(id)
    try {
      await fetch(`/api/financeiro/conciliacao/transacoes/${id}/ignorar`, { method: "PATCH" })
      toast({ title: "Transação ignorada" })
      loadTransacoes()
    } catch {
      toast({ title: "Erro ao ignorar", variant: "destructive" })
    } finally {
      setIgnorando(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Conciliação Bancária</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Importe um extrato OFX e concilie as transações com seus lançamentos financeiros.
        </p>
      </div>

      <div className="page-detail-content space-y-6">
        {/* Upload de OFX */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Extrato OFX
            </CardTitle>
            <CardDescription>Formatos suportados: .ofx</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="contaId">ID da Conta Bancária</Label>
                <Input
                  id="contaId"
                  placeholder="Ex: 1"
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ofxFile">Arquivo OFX</Label>
                <Input
                  id="ofxFile"
                  ref={fileRef}
                  type="file"
                  accept=".ofx"
                  className="w-64"
                />
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Importar</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transações pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Transações Pendentes</CardTitle>
              <CardDescription>
                {transacoes.length} transaç{transacoes.length !== 1 ? "ões" : "ão"} aguardando conciliação
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTransacoes} disabled={loadingTx}>
              <RefreshCcw className={`h-4 w-4 ${loadingTx ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : transacoes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p className="text-sm">Nenhuma transação pendente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 pr-4 font-medium">Data</th>
                      <th className="pb-2 pr-4 font-medium">Valor</th>
                      <th className="pb-2 pr-4 font-medium">Tipo</th>
                      <th className="pb-2 pr-4 font-medium">Memo</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 align-middle">
                        <td className="py-3 pr-4">{formatDate(tx.data)}</td>
                        <td className={`py-3 pr-4 font-medium ${tx.tipo === "credito" ? "text-emerald-600" : "text-red-600"}`}>
                          {tx.tipo === "debito" ? "-" : "+"}{formatCurrency(Math.abs(tx.valor))}
                        </td>
                        <td className="py-3 pr-4 capitalize">{tx.tipo}</td>
                        <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">{tx.memo ?? "-"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={STATUS_VARIANT[tx.status] ?? "outline"}>
                            {STATUS_LABEL[tx.status] ?? tx.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConciliar(tx)}
                              disabled={conciliando === tx.id}
                            >
                              {conciliando === tx.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Conciliar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleIgnorar(tx.id)}
                              disabled={ignorando === tx.id}
                            >
                              {ignorando === tx.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Ignorar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
