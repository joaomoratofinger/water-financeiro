"use client"

import { useEffect, useState } from "react"

export type CadastroOption = { id: number; nome: string; tipo?: string }

export function useFinanceiroCadastros() {
  const [categorias, setCategorias] = useState<CadastroOption[]>([])
  const [centrosCusto, setCentrosCusto] = useState<CadastroOption[]>([])
  const [contasBancarias, setContasBancarias] = useState<CadastroOption[]>([])
  const [fornecedores, setFornecedores] = useState<CadastroOption[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [cat, cc, cb, forn] = await Promise.all([
          fetch("/api/financeiro/cadastros/categorias", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/financeiro/cadastros/centros-custo", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/financeiro/cadastros/contas-bancarias", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/financeiro/cadastros/fornecedores", { cache: "no-store" }).then((r) => r.json()),
        ])
        setCategorias(Array.isArray(cat) ? cat : [])
        setCentrosCusto(Array.isArray(cc) ? cc : [])
        setContasBancarias(Array.isArray(cb) ? cb : [])
        setFornecedores(Array.isArray(forn) ? forn : [])
      } catch {
        // cadastros são opcionais nos formulários; segue sem eles se a chamada falhar
      }
    }
    load()
  }, [])

  return { categorias, centrosCusto, contasBancarias, fornecedores }
}
