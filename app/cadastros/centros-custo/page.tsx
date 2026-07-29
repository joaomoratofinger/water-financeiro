"use client"

import { FolderKanban } from "lucide-react"
import { CadastroCrud, AtivoBadge, type CrudColumn, type CrudField } from "@/components/cadastro-crud"

const columns: CrudColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "projeto_id", label: "ID do Projeto", render: (item) => item.projeto_id ?? "-" },
  { key: "projeto_codigo", label: "Código do Projeto", render: (item) => item.projeto_codigo ?? "-" },
  { key: "ativo", label: "Status", render: (item) => <AtivoBadge ativo={item.ativo} /> },
]

const fields: CrudField[] = [
  { key: "nome", label: "Nome", type: "text", required: true, placeholder: "Ex: Residencial Água Verde" },
  { key: "projeto_id", label: "ID do Projeto (opcional)", type: "number", placeholder: "Ex: 123" },
  { key: "projeto_codigo", label: "Código do Projeto (opcional)", type: "text", placeholder: "Ex: PRJ-0123" },
  { key: "ativo", label: "Ativo", type: "checkbox" },
]

export default function CentrosCustoPage() {
  return (
    <CadastroCrud
      title="Centros de Custo"
      description="Vinculados a projetos para apuração por obra"
      icon={<FolderKanban className="h-6 w-6 shrink-0" />}
      itemLabel="Centro de Custo"
      apiPath="/api/financeiro/cadastros/centros-custo"
      columns={columns}
      fields={fields}
      emptyMessage="Nenhum centro de custo cadastrado"
    />
  )
}
