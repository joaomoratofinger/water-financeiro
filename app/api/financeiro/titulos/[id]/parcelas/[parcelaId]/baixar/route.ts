import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; parcelaId: string }> },
) {
  try {
    const { id, parcelaId } = await context.params
    const body = await req.json()
    const res = await makeRequest(
      "POST",
      `${API_URL}/financeiro/titulos/${id}/parcelas/${parcelaId}/baixar`,
      body,
    )
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao baixar parcela" },
      { status: error?.status ?? 500 },
    )
  }
}
