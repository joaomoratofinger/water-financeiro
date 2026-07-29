"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

type Parcela = {
  id: number
  numero: number
  valor: number
  valor_pago: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
}

type Titulo = {
  id: number
  descricao: string
  valor_total: number
  cliente_nome: string | null
  fornecedor_id: number | null
  categoria_id: number | null
  centro_custo_id: number | null
  conta_bancaria_id: number | null
  data_competencia: string | null
  status: string
  observacoes: string | null
  parcelas: Parcela[]
}

const TITULO_STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  parcial: "Parcial",
  quitado: "Quitado",
  cancelado: "Cancelado",
}
const TITULO_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aberto: "default",
  parcial: "secondary",
  quitado: "outline",
  cancelado: "destructive",
}

const PARCELA_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  parcial: "Parcial",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
}
const PARCELA_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  pago: "secondary",
  parcial: "default",
  atrasado: "destructive",
  cancelado: "destructive",
}

const today = () => format(new Date(), "yyyy-MM-dd")

function gerarParcelas(valorTotal: number, numParcelas: number, primeiraData: string, intervaloDias: number) {
  if (!valorTotal || !numParcelas || !primeiraData) return []
  const valorParcela = Math.floor((valorTotal / numParcelas) * 100) / 100
  const linhas: { valor: string; data_vencimento: string }[] = []
  let acumulado = 0
  const base = new Date(`${primeiraData}T00:00:00`)
  for (let i = 0; i < numParcelas; i++) {
    const isLast = i === numParcelas - 1
    const valor = isLast ? Number((valorTotal - acumulado).toFixed(2)) : valorParcela
    acumulado += valorParcela
    const data = new Date(base)
    data.setDate(data.getDate() + intervaloDias * i)
    linhas.push({ valor: valor.toFixed(2), data_vencimento: format(data, "yyyy-MM-dd") })
  }
  return linhas
}

export function TitulosManager({ tipo }: { tipo: "pagar" | "receber" }) {
  const { toast } = useToast()
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const { categorias, centrosCusto, contasBancarias, fornecedores } = useFinanceiroCadastros()

  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    descricao: "",
    valor_total: "",
    cliente_nome: "",
    fornecedor_id: "",
    categoria_id: "",
    centro_custo_id: "",
    conta_bancaria_id: "",
    data_competencia: today(),
    observacoes: "",
    num_parcelas: "1",
    primeira_vencimento: today(),
    intervalo_dias: "30",
  })
  const [parcelasForm, setParcelasForm] = useState<{ valor: string; data_vencimento: string }[]>([
    { valor: "", data_vencimento: today() },
  ])

  const [baixaTarget, setBaixaTarget] = useState<{ titulo: Titulo; parcela: Parcela } | null>(null)
  const [baixando, setBaixando] = useState(false)
  const [baixaForm, setBaixaForm] = useState({
    valor_pago: "",
    data_pagamento: today(),
    conta_bancaria_id: "",
    categoria_id: "",
    centro_custo_id: "",
    observacoes: "",
  })

  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  const icon = tipo === "pagar" ? <ArrowUpCircle className="h-6 w-6 text-red-600 shrink-0" /> : <ArrowDownCircle className="h-6 w-6 text-emerald-600 shrink-0" />
  const titulo = tipo === "pagar" ? "Contas a Pagar" : "Contas a Receber"
  const categoriaTipo = tipo === "pagar" ? "despesa" : "receita"

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/financeiro/titulos?tipo=${tipo}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar")
      setTitulos(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [tipo])

  useEffect(() => {
    load()
  }, [load])

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c: any) => c.tipo === categoriaTipo),
    [categorias, categoriaTipo],
  )

  const nomeFornecedor = (id: number | null) => fornecedores.find((f) => f.id === id)?.nome ?? "-"

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setForm({
      descricao: "",
      valor_total: "",
      cliente_nome: "",
      fornecedor_id: "",
      categoria_id: "",
      centro_custo_id: "",
      conta_bancaria_id: "",
      data_competencia: today(),
      observacoes: "",
      num_parcelas: "1",
      primeira_vencimento: today(),
      intervalo_dias: "30",
    })
    setParcelasForm([{ valor: "", data_vencimento: today() }])
    setCreateOpen(true)
  }

  const handleGerarParcelas = () => {
    const valorTotal = Number(form.valor_total)
    const numParcelas = Number(form.num_parcelas)
    if (!valorTotal || valorTotal <= 0) {
      toast({ title: "Informe o valor total antes de gerar as parcelas", variant: "destructive" })
      return
    }
    if (!numParcelas || numParcelas <= 0) {
      toast({ title: "Informe um número de parcelas válido", variant: "destructive" })
      return
    }
    setParcelasForm(
      gerarParcelas(valorTotal, numParcelas, form.primeira_vencimento, Number(form.intervalo_dias) || 0),
    )
  }

  const updateParcelaForm = (index: number, key: "valor" | "data_vencimento", value: string) => {
    setParcelasForm((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)))
  }

  const addParcelaRow = () => {
    setParcelasForm((prev) => [...prev, { valor: "", data_vencimento: today() }])
  }

  const removeParcelaRow = (index: number) => {
    setParcelasForm((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const somaParcelas = parcelasForm.reduce((s, p) => s + (Number(p.valor) || 0), 0)

  const handleCreate = async () => {
    const valorTotal = Number(form.valor_total)
    if (!form.descricao.trim()) {
      toast({ title: "Informe a descrição", variant: "destructive" })
      return
    }
    if (!valorTotal || valorTotal <= 0) {
      toast({ title: "Informe um valor total válido", variant: "destructive" })
      return
    }
    if (parcelasForm.some((p) => !p.valor || !p.data_vencimento)) {
      toast({ title: "Preencha valor e vencimento de todas as parcelas", variant: "destructive" })
      return
    }
    if (Math.abs(somaParcelas - valorTotal) > 0.01) {
      toast({
        title: "Soma das parcelas diferente do valor total",
        description: `Parcelas somam ${formatCurrency(somaParcelas)}, valor total é ${formatCurrency(valorTotal)}`,
        variant: "destructive",
      })
      return
    }

    const payload = {
      tipo,
      descricao: form.descricao,
      valor_total: valorTotal,
      cliente_nome: tipo === "receber" ? form.cliente_nome || undefined : undefined,
      fornecedor_id: tipo === "pagar" && form.fornecedor_id ? Number(form.fornecedor_id) : undefined,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
      centro_custo_id: form.centro_custo_id ? Number(form.centro_custo_id) : undefined,
      conta_bancaria_id: form.conta_bancaria_id ? Number(form.conta_bancaria_id) : undefined,
      data_competencia: form.data_competencia || undefined,
      observacoes: form.observacoes || undefined,
      parcelas: parcelasForm.map((p) => ({ valor: Number(p.valor), data_vencimento: p.data_vencimento })),
    }

    setSaving(true)
    try {
      const res = await fetch("/api/financeiro/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao criar título")
      toast({ title: "Título criado" })
      setCreateOpen(false)
      load()
    } catch (e) {
      toast({
        title: "Erro ao criar título",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openBaixa = (t: Titulo, p: Parcela) => {
    setBaixaTarget({ titulo: t, parcela: p })
    setBaixaForm({
      valor_pago: (Number(p.valor) - Number(p.valor_pago)).toFixed(2),
      data_pagamento: today(),
      conta_bancaria_id: t.conta_bancaria_id ? String(t.conta_bancaria_id) : "",
      categoria_id: t.categoria_id ? String(t.categoria_id) : "",
      centro_custo_id: t.centro_custo_id ? String(t.centro_custo_id) : "",
      observacoes: "",
    })
  }

  const handleBaixar = async () => {
    if (!baixaTarget) return
    const valorPago = Number(baixaForm.valor_pago)
    if (!valorPago || valorPago <= 0) {
      toast({ title: "Informe um valor pago válido", variant: "destructive" })
      return
    }
    if (!baixaForm.conta_bancaria_id) {
      toast({ title: "Selecione a conta bancária", variant: "destructive" })
      return
    }

    setBaixando(true)
    try {
      const res = await fetch(
        `/api/financeiro/titulos/${baixaTarget.titulo.id}/parcelas/${baixaTarget.parcela.id}/baixar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valor_pago: valorPago,
            data_pagamento: baixaForm.data_pagamento,
            conta_bancaria_id: Number(baixaForm.conta_bancaria_id),
            categoria_id: baixaForm.categoria_id ? Number(baixaForm.categoria_id) : undefined,
            centro_custo_id: baixaForm.centro_custo_id ? Number(baixaForm.centro_custo_id) : undefined,
            observacoes: baixaForm.observacoes || undefined,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao baixar parcela")
      toast({ title: "Parcela baixada" })
      setBaixaTarget(null)
      load()
    } catch (e) {
      toast({
        title: "Erro ao baixar parcela",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setBaixando(false)
    }
  }

  const handleCancelar = async (t: Titulo) => {
    if (!window.confirm(`Cancelar o título "${t.descricao}"? Parcelas em aberto não poderão mais ser baixadas.`)) return
    setCancelandoId(t.id)
    try {
      const res = await fetch(`/api/financeiro/titulos/${t.id}/cancelar`, { method: "PATCH" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? "Erro ao cancelar título")
      }
      toast({ title: "Título cancelado" })
      load()
    } catch (e) {
      toast({
        title: "Erro ao cancelar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setCancelandoId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-xl sm:text-2xl font-bold">{titulo}</h1>
        </div>
        <Button className="mobile-action-btn" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo título
        </Button>
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
            Carregando…
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {titulos.length} título{titulos.length !== 1 ? "s" : ""} {tipo === "pagar" ? "a pagar" : "a receber"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 pr-4 font-medium w-8" />
                      <th className="pb-2 pr-4 font-medium">Descrição</th>
                      <th className="pb-2 pr-4 font-medium">{tipo === "pagar" ? "Fornecedor" : "Cliente"}</th>
                      <th className="pb-2 pr-4 font-medium">Valor</th>
                      <th className="pb-2 pr-4 font-medium">Parcelas</th>
                      <th className="pb-2 pr-4 font-medium">Competência</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titulos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          Nenhum título {tipo === "pagar" ? "a pagar" : "a receber"} cadastrado
                        </td>
                      </tr>
                    ) : (
                      titulos.map((t) => {
                        const isOpen = expanded.has(t.id)
                        const pagas = t.parcelas.filter((p) => p.status === "pago").length
                        return (
                          <Fragment key={t.id}>
                            <tr className="border-b last:border-0 hover:bg-muted/30">
                              <td className="py-3 pr-4">
                                <button onClick={() => toggleExpand(t.id)} className="text-muted-foreground">
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              </td>
                              <td className="py-3 pr-4">{t.descricao}</td>
                              <td className="py-3 pr-4 text-muted-foreground">
                                {tipo === "pagar" ? nomeFornecedor(t.fornecedor_id) : t.cliente_nome ?? "-"}
                              </td>
                              <td className={`py-3 pr-4 font-medium ${tipo === "pagar" ? "text-red-600" : "text-emerald-600"}`}>
                                {formatCurrency(t.valor_total)}
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground">
                                {pagas}/{t.parcelas.length} pagas
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground">{formatDate(t.data_competencia)}</td>
                              <td className="py-3 pr-4">
                                <Badge variant={TITULO_STATUS_VARIANT[t.status] ?? "outline"}>
                                  {TITULO_STATUS_LABEL[t.status] ?? t.status}
                                </Badge>
                              </td>
                              <td className="py-3">
                                {t.status !== "cancelado" && t.status !== "quitado" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancelar(t)}
                                    disabled={cancelandoId === t.id}
                                  >
                                    {cancelandoId === t.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <XCircle className="h-3 w-3 mr-1 text-destructive" />
                                    )}
                                    Cancelar
                                  </Button>
                                )}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="border-b last:border-0 bg-muted/20">
                                <td />
                                <td colSpan={7} className="py-3 pr-4">
                                  <div className="rounded-md border bg-background">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b text-muted-foreground text-left">
                                          <th className="p-2 font-medium">Nº</th>
                                          <th className="p-2 font-medium">Vencimento</th>
                                          <th className="p-2 font-medium">Valor</th>
                                          <th className="p-2 font-medium">Pago</th>
                                          <th className="p-2 font-medium">Status</th>
                                          <th className="p-2 font-medium">Ação</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {t.parcelas
                                          .sort((a, b) => a.numero - b.numero)
                                          .map((p) => (
                                            <tr key={p.id} className="border-b last:border-0">
                                              <td className="p-2">{p.numero}</td>
                                              <td className="p-2">{formatDate(p.data_vencimento)}</td>
                                              <td className="p-2">{formatCurrency(p.valor)}</td>
                                              <td className="p-2">{formatCurrency(p.valor_pago)}</td>
                                              <td className="p-2">
                                                <Badge variant={PARCELA_STATUS_VARIANT[p.status] ?? "outline"}>
                                                  {PARCELA_STATUS_LABEL[p.status] ?? p.status}
                                                </Badge>
                                              </td>
                                              <td className="p-2">
                                                {(p.status === "pendente" || p.status === "parcial" || p.status === "atrasado") && (
                                                  <Button size="sm" variant="outline" onClick={() => openBaixa(t, p)}>
                                                    <CircleDollarSign className="h-3 w-3 mr-1" />
                                                    Baixar
                                                  </Button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: novo título */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo título {tipo === "pagar" ? "a pagar" : "a receber"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder={tipo === "pagar" ? "Ex: Aluguel do escritório" : "Ex: Honorários projeto residencial"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="valor_total">Valor Total *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  value={form.valor_total}
                  onChange={(e) => setForm((f) => ({ ...f, valor_total: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="data_competencia">Competência</Label>
                <Input
                  id="data_competencia"
                  type="date"
                  value={form.data_competencia}
                  onChange={(e) => setForm((f) => ({ ...f, data_competencia: e.target.value }))}
                />
              </div>
            </div>

            {tipo === "pagar" ? (
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

            <div className="space-y-1">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Parcelamento</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="num_parcelas">Nº de parcelas</Label>
                  <Input
                    id="num_parcelas"
                    type="number"
                    min={1}
                    value={form.num_parcelas}
                    onChange={(e) => setForm((f) => ({ ...f, num_parcelas: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="primeira_vencimento">1º vencimento</Label>
                  <Input
                    id="primeira_vencimento"
                    type="date"
                    value={form.primeira_vencimento}
                    onChange={(e) => setForm((f) => ({ ...f, primeira_vencimento: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="intervalo_dias">Intervalo (dias)</Label>
                  <Input
                    id="intervalo_dias"
                    type="number"
                    min={0}
                    value={form.intervalo_dias}
                    onChange={(e) => setForm((f) => ({ ...f, intervalo_dias: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleGerarParcelas}>
                <Wand2 className="h-3 w-3 mr-2" />
                Gerar parcelas
              </Button>

              <div className="space-y-2">
                {parcelasForm.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}º</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={p.valor}
                      onChange={(e) => updateParcelaForm(i, "valor", e.target.value)}
                      className="w-28"
                    />
                    <Input
                      type="date"
                      value={p.data_vencimento}
                      onChange={(e) => updateParcelaForm(i, "data_vencimento", e.target.value)}
                      className="w-40"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParcelaRow(i)}
                      disabled={parcelasForm.length <= 1}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={addParcelaRow}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar parcela
                </Button>
              </div>

              <p
                className={`text-xs ${
                  Math.abs(somaParcelas - (Number(form.valor_total) || 0)) > 0.01
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                Soma das parcelas: {formatCurrency(somaParcelas)}
                {form.valor_total ? ` de ${formatCurrency(Number(form.valor_total))}` : ""}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: baixar parcela */}
      <Dialog open={!!baixaTarget} onOpenChange={(open) => !open && setBaixaTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Baixar parcela {baixaTarget ? `${baixaTarget.parcela.numero} — ${baixaTarget.titulo.descricao}` : ""}
            </DialogTitle>
          </DialogHeader>

          {baixaTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="valor_pago">Valor Pago *</Label>
                  <Input
                    id="valor_pago"
                    type="number"
                    step="0.01"
                    value={baixaForm.valor_pago}
                    onChange={(e) => setBaixaForm((f) => ({ ...f, valor_pago: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
                  <Input
                    id="data_pagamento"
                    type="date"
                    value={baixaForm.data_pagamento}
                    onChange={(e) => setBaixaForm((f) => ({ ...f, data_pagamento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Conta Bancária *</Label>
                <Select
                  value={baixaForm.conta_bancaria_id}
                  onValueChange={(v) => setBaixaForm((f) => ({ ...f, conta_bancaria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select
                    value={baixaForm.categoria_id}
                    onValueChange={(v) => setBaixaForm((f) => ({ ...f, categoria_id: v }))}
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
                    value={baixaForm.centro_custo_id}
                    onValueChange={(v) => setBaixaForm((f) => ({ ...f, centro_custo_id: v }))}
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="baixa_observacoes">Observações</Label>
                <Textarea
                  id="baixa_observacoes"
                  value={baixaForm.observacoes}
                  onChange={(e) => setBaixaForm((f) => ({ ...f, observacoes: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBaixaTarget(null)} disabled={baixando}>
              Cancelar
            </Button>
            <Button onClick={handleBaixar} disabled={baixando}>
              {baixando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
