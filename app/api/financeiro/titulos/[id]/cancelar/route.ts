import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const res = await makeRequest("PATCH", `${API_URL}/financeiro/titulos/${id}/cancelar`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao cancelar título" },
      { status: error?.status ?? 500 },
    )
  }
}
