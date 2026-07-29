"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Loader2, Pencil, Plus, Repeat, Trash2, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useFinanceiroCadastros } from "@/hooks/use-financeiro-cadastros"

type Recorrencia = {
  id: number
  tipo: "pagar" | "receber"
  descricao: string
  valor: number
  cliente_nome: string | null
  fornecedor_id: number | null
  categoria_id: number | null
  centro_custo_id: number | null
  conta_bancaria_id: number | null
  dia_vencimento: number
  data_inicio: string
  data_fim: string | null
  ativo: boolean
  observacoes: string | null
}

const TIPO_LABEL: Record<string, string> = { pagar: "A Pagar", receber: "A Receber" }
const TIPO_VARIANT: Record<string, "default" | "secondary"> = { pagar: "default", receber: "secondary" }

const mesAtual = () => format(new Date(), "yyyy-MM")
const hoje = () => format(new Date(), "yyyy-MM-dd")

const emptyForm = () => ({
  tipo: "pagar" as "pagar" | "receber",
  descricao: "",
  valor: "",
  cliente_nome: "",
  fornecedor_id: "",
  categoria_id: "",
  centro_custo_id: "",
  conta_bancaria_id: "",
  dia_vencimento: "10",
  data_inicio: hoje(),
  data_fim: "",
  observacoes: "",
  ativo: true,
})

export function RecorrenciasManager() {
  const { toast } = useToast()
  const { categorias, centrosCusto, contasBancarias, fornecedores } = useFinanceiroCadastros()

  const [items, setItems] = useState<Recorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Recorrencia | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [referencia, setReferencia] = useState(mesAtual())
  const [gerando, setGerando] = useState(false)

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.tipo === (form.tipo === "pagar" ? "despesa" : "receita")),
    [categorias, form.tipo],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/financeiro/recorrencias", { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar recorrências")
      setItems(await res.json())
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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (item: Recorrencia) => {
    setEditing(item)
    setForm({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: String(item.valor),
      cliente_nome: item.cliente_nome ?? "",
      fornecedor_id: item.fornecedor_id ? String(item.fornecedor_id) : "",
      categoria_id: item.categoria_id ? String(item.categoria_id) : "",
      centro_custo_id: item.centro_custo_id ? String(item.centro_custo_id) : "",
      conta_bancaria_id: item.conta_bancaria_id ? String(item.conta_bancaria_id) : "",
      dia_vencimento: String(item.dia_vencimento),
      data_inicio: item.data_inicio.slice(0, 10),
      data_fim: item.data_fim ? item.data_fim.slice(0, 10) : "",
      observacoes: item.observacoes ?? "",
      ativo: item.ativo,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.descricao.trim()) {
      toast({ title: "Informe a descrição", variant: "destructive" })
      return
    }
    const valor = Number(form.valor)
    if (!valor || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" })
      return
    }
    const dia = Number(form.dia_vencimento)
    if (!dia || dia < 1 || dia > 28) {
      toast({ title: "Dia de vencimento deve ser entre 1 e 28", variant: "destructive" })
      return
    }
    if (!form.data_inicio) {
      toast({ title: "Informe a data de início", variant: "destructive" })
      return
    }

    const payload = {
      tipo: form.tipo,
      descricao: form.descricao,
      valor,
      cliente_nome: form.tipo === "receber" ? form.cliente_nome || undefined : undefined,
      fornecedor_id: form.tipo === "pagar" && form.fornecedor_id ? Number(form.fornecedor_id) : undefined,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
      centro_custo_id: form.centro_custo_id ? Number(form.centro_custo_id) : undefined,
      conta_bancaria_id: form.conta_bancaria_id ? Number(form.conta_bancaria_id) : undefined,
      dia_vencimento: dia,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || undefined,
      observacoes: form.observacoes || undefined,
      ativo: form.ativo,
    }

    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/financeiro/recorrencias/${editing.id}` : "/api/financeiro/recorrencias", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar")
      toast({ title: editing ? "Recorrência atualizada" : "Recorrência criada" })
      setDialogOpen(false)
      load()
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Recorrencia) => {
    if (!window.confirm(`Remover a recorrência "${item.descricao}"? Títulos já gerados não serão afetados.`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/financeiro/recorrencias/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? "Erro ao remover")
      }
      toast({ title: "Recorrência removida" })
      load()
    } catch (e) {
      toast({
        title: "Erro ao remover",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleGerar = async () => {
    setGerando(true)
    try {
      const res = await fetch("/api/financeiro/recorrencias/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referencia }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao gerar títulos")
      toast({
        title: `${data.gerados} título${data.gerados !== 1 ? "s" : ""} gerado${data.gerados !== 1 ? "s" : ""}`,
        description: data.ignorados > 0 ? `${data.ignorados} recorrência(s) ignorada(s) (já geradas ou fora do período)` : undefined,
      })
    } catch (e) {
      toast({
        title: "Erro ao gerar títulos",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Repeat className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Recorrências</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="month"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={handleGerar} disabled={gerando}>
            {gerando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Gerar títulos do mês
          </Button>
          <Button className="mobile-action-btn" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova recorrência
          </Button>
        </div>
      </div>

      <div className="page-detail-content">
        <p className="text-sm text-muted-foreground mb-4">
          Cadastre despesas e receitas fixas (aluguel, salários, mensalidades) e gere os títulos do mês com um clique,
          sem recriar tudo manualmente.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando…
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {items.length} recorrência{items.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 pr-4 font-medium">Descrição</th>
                      <th className="pb-2 pr-4 font-medium">Tipo</th>
                      <th className="pb-2 pr-4 font-medium">Fornecedor/Cliente</th>
                      <th className="pb-2 pr-4 font-medium">Valor</th>
                      <th className="pb-2 pr-4 font-medium">Dia Venc.</th>
                      <th className="pb-2 pr-4 font-medium">Início</th>
                      <th className="pb-2 pr-4 font-medium">Fim</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          Nenhuma recorrência cadastrada
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4">{item.descricao}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={TIPO_VARIANT[item.tipo]}>{TIPO_LABEL[item.tipo]}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {item.tipo === "pagar" ? nomeFornecedor(item.fornecedor_id) : item.cliente_nome ?? "-"}
                          </td>
                          <td className="py-3 pr-4 font-medium">{formatCurrency(item.valor)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{item.dia_vencimento}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{formatDate(item.data_inicio)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{item.data_fim ? formatDate(item.data_fim) : "-"}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={item.ativo ? "secondary" : "outline"}>{item.ativo ? "Ativa" : "Inativa"}</Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Recorrência" : "Nova Recorrência"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as "pagar" | "receber" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">A Pagar</SelectItem>
                  <SelectItem value="receber">A Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder={form.tipo === "pagar" ? "Ex: Aluguel do escritório" : "Ex: Mensalidade de consultoria"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dia_vencimento">Dia do vencimento (1-28) *</Label>
                <Input
                  id="dia_vencimento"
                  type="number"
                  min={1}
                  max={28}
                  value={form.dia_vencimento}
                  onChange={(e) => setForm((f) => ({ ...f, dia_vencimento: e.target.value }))}
                />
              </div>
            </div>

            {form.tipo === "pagar" ? (
              <div className="space-y-1">
                <Label>Fornecedor</Label>
                <Select
                  value={form.fornecedor_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, fornecedor_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="cliente_nome">Cliente</Label>
                <Input
                  id="cliente_nome"
                  value={form.cliente_nome}
                  onChange={(e) => setForm((f) => ({ ...f, cliente_nome: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasFiltradas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Centro de Custo</Label>
                <Select
                  value={form.centro_custo_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, centro_custo_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Conta Bancária</Label>
                <Select
                  value={form.conta_bancaria_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, conta_bancaria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancarias.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="data_inicio">Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="data_fim">Fim (opcional)</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: !!v }))}
              />
              <label htmlFor="ativo" className="text-sm text-muted-foreground">
                Ativa (gera títulos automaticamente ao clicar em "Gerar títulos do mês")
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
