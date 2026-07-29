import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await makeRequest("GET", `${API_URL}/profile`)
    return NextResponse.json(res.data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao buscar perfil" },
      { status: error?.status ?? 500 },
    )
  }
}
