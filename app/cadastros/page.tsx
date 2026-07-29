"use client"

import { Building2 } from "lucide-react"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
  {
    href: "/cadastros/contas-bancarias",
    title: "Contas Bancárias",
    description: "Cadastro de contas bancárias para movimentações e conciliação",
  },
  {
    href: "/cadastros/categorias",
    title: "Categorias / Plano de Contas",
    description: "Receitas e despesas classificadas para o DRE",
  },
  {
    href: "/cadastros/centros-custo",
    title: "Centros de Custo",
    description: "Vinculados a projetos para apuração por obra",
  },
  {
    href: "/cadastros/fornecedores",
    title: "Fornecedores",
    description: "Cadastro de fornecedores para contas a pagar",
  },
]

export default function CadastrosPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="page-detail-header">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Cadastros</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Tabelas auxiliares do módulo financeiro
        </p>
      </div>

      <div className="page-detail-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
