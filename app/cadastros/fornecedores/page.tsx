"use client"

import { Truck } from "lucide-react"
import { CadastroCrud, AtivoBadge, type CrudColumn, type CrudField } from "@/components/cadastro-crud"

const columns: CrudColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "documento", label: "CNPJ/CPF", render: (item) => item.documento ?? "-" },
  { key: "email", label: "E-mail", render: (item) => item.email ?? "-" },
  { key: "telefone", label: "Telefone", render: (item) => item.telefone ?? "-" },
  { key: "ativo", label: "Status", render: (item) => <AtivoBadge ativo={item.ativo} /> },
]

const fields: CrudField[] = [
  { key: "nome", label: "Nome", type: "text", required: true, placeholder: "Ex: Fornecedor LTDA" },
  { key: "documento", label: "CNPJ/CPF", type: "text", placeholder: "Ex: 00.000.000/0001-00" },
  { key: "email", label: "E-mail", type: "text", placeholder: "Ex: contato@fornecedor.com" },
  { key: "telefone", label: "Telefone", type: "text", placeholder: "Ex: (11) 99999-9999" },
  { key: "ativo", label: "Ativo", type: "checkbox" },
]

export default function FornecedoresPage() {
  return (
    <CadastroCrud
      title="Fornecedores"
      description="Cadastro de fornecedores para contas a pagar"
      icon={<Truck className="h-6 w-6 shrink-0" />}
      itemLabel="Fornecedor"
      apiPath="/api/financeiro/cadastros/fornecedores"
      columns={columns}
      fields={fields}
      emptyMessage="Nenhum fornecedor cadastrado"
    />
  )
}
