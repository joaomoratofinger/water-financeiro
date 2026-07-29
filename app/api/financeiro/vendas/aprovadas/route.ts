import { API_URL } from "@/constants"
import { makeRequest } from "@/lib/requests-helper"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [serviceRes, productRes] = await Promise.all([
      makeRequest("GET", `${API_URL}/firebase-service-quotes`),
      makeRequest("GET", `${API_URL}/financeiro/titulos?tipo=receber`),
    ])

    const quotes: any[] = serviceRes.data ?? []
    const titulosExistentes: any[] = productRes.data ?? []
    const origensJaImportadas = new Set(titulosExistentes.map((t: any) => t.origem_ref))

    const aprovadas = quotes.filter(
      (q: any) =>
        q.status === "architechture_approved" && !origensJaImportadas.has(q.id),
    )

    return NextResponse.json(aprovadas)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Erro ao buscar vendas aprovadas" },
      { status: error?.status ?? 500 },
    )
  }
}
