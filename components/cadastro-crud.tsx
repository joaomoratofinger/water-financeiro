"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useToast } from "@/hooks/use-toast"

export type CrudField = {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox"
  required?: boolean
  placeholder?: string
  step?: string
  options?: { value: string; label: string }[]
}

export type CrudColumn = {
  key: string
  label: string
  render?: (item: any) => ReactNode
}

type CadastroCrudProps = {
  title: string
  description: string
  icon: ReactNode
  itemLabel: string
  apiPath: string
  columns: CrudColumn[]
  fields: CrudField[] | ((items: any[], editing: any | null) => CrudField[])
  emptyMessage?: string
}

export function CadastroCrud({
  title,
  description,
  icon,
  itemLabel,
  apiPath,
  columns,
  fields,
  emptyMessage = "Nenhum registro cadastrado",
}: CadastroCrudProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const resolvedFields = useMemo(
    () => (typeof fields === "function" ? fields(items, editing) : fields),
    [fields, items, editing],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiPath, { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao carregar registros")
      setItems(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    const defaults: Record<string, any> = {}
    for (const f of typeof fields === "function" ? fields(items, null) : fields) {
      defaults[f.key] = f.type === "checkbox" ? true : ""
    }
    setForm(defaults)
    setDialogOpen(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ ...item })
    setDialogOpen(true)
  }

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    for (const f of resolvedFields) {
      if (f.required && (form[f.key] === "" || form[f.key] === null || form[f.key] === undefined)) {
        toast({ title: `Preencha o campo "${f.label}"`, variant: "destructive" })
        return
      }
    }

    const payload: Record<string, any> = {}
    for (const f of resolvedFields) {
      const value = form[f.key]
      payload[f.key] = f.type === "number" && value !== "" ? Number(value) : value
    }

    setSaving(true)
    try {
      const res = await fetch(editing ? `${apiPath}/${editing.id}` : apiPath, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar")
      toast({ title: editing ? `${itemLabel} atualizado` : `${itemLabel} criado` })
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

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Remover "${item.nome}"?`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`${apiPath}/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? "Erro ao remover")
      }
      toast({ title: `${itemLabel} removido` })
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

  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header flex items-center justify-between gap-4">
        <div>
          <Link
            href="/cadastros"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Cadastros
          </Link>
          <div className="flex items-center gap-2">
            {icon}
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button className="mobile-action-btn" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo {itemLabel}
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
                {items.length} registro{items.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      {columns.map((c) => (
                        <th key={c.key} className="pb-2 pr-4 font-medium">
                          {c.label}
                        </th>
                      ))}
                      <th className="pb-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                          {emptyMessage}
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                          {columns.map((c) => (
                            <td key={c.key} className="py-3 pr-4">
                              {c.render ? c.render(item) : (item[c.key] ?? "-")}
                            </td>
                          ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${itemLabel}` : `Novo ${itemLabel}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {resolvedFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>

                {f.type === "text" || f.type === "number" ? (
                  <Input
                    id={f.key}
                    type={f.type}
                    step={f.step}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.key] != null ? String(form[f.key]) : ""}
                    onValueChange={(v) => handleChange(f.key, v)}
                  >
                    <SelectTrigger id={f.key}>
                      <SelectValue placeholder={f.placeholder ?? "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id={f.key}
                      checked={!!form[f.key]}
                      onCheckedChange={(v) => handleChange(f.key, !!v)}
                    />
                    <label htmlFor={f.key} className="text-sm text-muted-foreground">
                      Ativo
                    </label>
                  </div>
                )}
              </div>
            ))}
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

export function AtivoBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "secondary" : "outline"}>{ativo ? "Ativo" : "Inativo"}</Badge>
  )
}
