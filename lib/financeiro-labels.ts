export const GRUPO_DRE_OPTIONS = [
  { value: "receita_bruta", label: "Receita Bruta" },
  { value: "deducoes", label: "Deduções" },
  { value: "receita_liquida", label: "Receita Líquida" },
  { value: "custo_servicos", label: "Custo de Serviços" },
  { value: "lucro_bruto", label: "Lucro Bruto" },
  { value: "despesa_operacional", label: "Despesa Operacional" },
  { value: "despesa_adm", label: "Despesa Administrativa" },
  { value: "despesa_financeira", label: "Despesa Financeira" },
  { value: "outros", label: "Outros" },
]

export const CATEGORIA_TIPO_OPTIONS = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
]

export const AGING_BUCKET_LABEL: Record<string, string> = {
  a_vencer: "A vencer",
  atrasado_1_30: "1 a 30 dias",
  atrasado_31_60: "31 a 60 dias",
  atrasado_61_90: "61 a 90 dias",
  atrasado_90_mais: "Mais de 90 dias",
}

export const AGING_BUCKET_ORDER = [
  "a_vencer",
  "atrasado_1_30",
  "atrasado_31_60",
  "atrasado_61_90",
  "atrasado_90_mais",
]
