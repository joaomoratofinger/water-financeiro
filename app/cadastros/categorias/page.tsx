"use client"

import { Tags } from "lucide-react"
import { CadastroCrud, AtivoBadge, type CrudColumn, type CrudField } from "@/components/cadastro-crud"
import { CATEGORIA_TIPO_OPTIONS as TIPO_OPTIONS, GRUPO_DRE_OPTIONS } from "@/lib/financeiro-labels"

const columns: CrudColumn[] = [
  { key: "nome", label: "Nome" },
  {
    key: "tipo",
    label: "Tipo",
    render: (item) => TIPO_OPTIONS.find((t) => t.value === item.tipo)?.label ?? item.tipo,
  },
  {
    key: "grupo_dre",
    label: "Grupo DRE",
    render: (item) => GRUPO_DRE_OPTIONS.find((t) => t.value === item.grupo_dre)?.label ?? item.grupo_dre,
  },
  { key: "pai", label: "Categoria Pai", render: (item) => item.pai?.nome ?? "-" },
  { key: "ativo", label: "Status", render: (item) => <AtivoBadge ativo={item.ativo} /> },
]

export default function CategoriasPage() {
  const fields = (items: any[], editing: any | null): CrudField[] => [
    { key: "nome", label: "Nome", type: "text", required: true, placeholder: "Ex: Honorários de Projeto" },
    { key: "tipo", label: "Tipo", type: "select", required: true, options: TIPO_OPTIONS },
    { key: "grupo_dre", label: "Grupo DRE", type: "select", required: true, options: GRUPO_DRE_OPTIONS },
    {
      key: "pai_id",
      label: "Categoria Pai",
      type: "select",
      options: items
        .filter((c) => c.id !== editing?.id)
        .map((c) => ({ value: String(c.id), label: c.nome })),
    },
    { key: "ativo", label: "Ativo", type: "checkbox" },
  ]

  return (
    <CadastroCrud
      title="Categorias / Plano de Contas"
      description="Receitas e despesas classificadas para o DRE"
      icon={<Tags className="h-6 w-6 shrink-0" />}
      itemLabel="Categoria"
      apiPath="/api/financeiro/cadastros/categorias"
      columns={columns}
      fields={fields}
      emptyMessage="Nenhuma categoria cadastrada"
    />
  )
}
