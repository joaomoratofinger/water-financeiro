import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await makeRequest("GET", `${API_URL}/financeiro/relatorios/inadimplencia`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao carregar inadimplência" },
      { status: error?.status ?? 500 },
    )
  }
}
