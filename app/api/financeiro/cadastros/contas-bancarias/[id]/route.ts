import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const res = await makeRequest("PATCH", `${API_URL}/financeiro/contas-bancarias/${id}`, body)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao atualizar conta bancária" },
      { status: error?.status ?? 500 },
    )
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const res = await makeRequest("DELETE", `${API_URL}/financeiro/contas-bancarias/${id}`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao remover conta bancária" },
      { status: error?.status ?? 500 },
    )
  }
}
