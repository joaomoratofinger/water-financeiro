"use client"

import { Landmark } from "lucide-react"
import { CadastroCrud, AtivoBadge, type CrudColumn, type CrudField } from "@/components/cadastro-crud"
import { formatCurrency } from "@/lib/utils"

const TIPO_OPTIONS = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Poupança" },
  { value: "caixa", label: "Caixa" },
]

const columns: CrudColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "banco", label: "Banco" },
  { key: "agencia", label: "Agência" },
  { key: "conta", label: "Conta" },
  {
    key: "tipo",
    label: "Tipo",
    render: (item) => TIPO_OPTIONS.find((t) => t.value === item.tipo)?.label ?? item.tipo,
  },
  { key: "saldo_inicial", label: "Saldo Inicial", render: (item) => formatCurrency(item.saldo_inicial) },
  { key: "ativo", label: "Status", render: (item) => <AtivoBadge ativo={item.ativo} /> },
]

const fields: CrudField[] = [
  { key: "nome", label: "Nome", type: "text", required: true, placeholder: "Ex: Conta Principal PJ" },
  { key: "banco", label: "Banco", type: "text", placeholder: "Ex: Itaú" },
  { key: "agencia", label: "Agência", type: "text", placeholder: "Ex: 0001" },
  { key: "conta", label: "Conta", type: "text", placeholder: "Ex: 12345-6" },
  { key: "tipo", label: "Tipo", type: "select", required: true, options: TIPO_OPTIONS },
  { key: "saldo_inicial", label: "Saldo Inicial", type: "number", step: "0.01", placeholder: "0,00" },
  { key: "ativo", label: "Ativo", type: "checkbox" },
]

export default function ContasBancariasPage() {
  return (
    <CadastroCrud
      title="Contas Bancárias"
      description="Cadastro de contas bancárias para movimentações e conciliação"
      icon={<Landmark className="h-6 w-6 shrink-0" />}
      itemLabel="Conta Bancária"
      apiPath="/api/financeiro/cadastros/contas-bancarias"
      columns={columns}
      fields={fields}
      emptyMessage="Nenhuma conta bancária cadastrada"
    />
  )
}
