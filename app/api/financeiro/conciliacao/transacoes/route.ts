import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = new URLSearchParams()
    for (const [k, v] of searchParams) params.append(k, v)
    const res = await makeRequest("GET", `${API_URL}/financeiro/conciliacao/transacoes?${params}`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao carregar transações" },
      { status: error?.status ?? 500 },
    )
  }
}
