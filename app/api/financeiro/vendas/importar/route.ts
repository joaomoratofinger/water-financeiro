import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await makeRequest("POST", `${API_URL}/financeiro/vendas/importar`, body)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao importar venda" },
      { status: error?.status ?? 500 },
    )
  }
}
