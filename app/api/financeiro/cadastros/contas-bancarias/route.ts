import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await makeRequest("GET", `${API_URL}/financeiro/contas-bancarias`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao carregar contas bancárias" },
      { status: error?.status ?? 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await makeRequest("POST", `${API_URL}/financeiro/contas-bancarias`, body)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao criar conta bancária" },
      { status: error?.status ?? 500 },
    )
  }
}
