import { API_URL } from "@/constants"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value

    const formData = await req.formData()
    const axiosForm = new FormData()
    for (const [key, value] of formData.entries()) {
      axiosForm.append(key, value as any)
    }

    const res = await axios.post(`${API_URL}/financeiro/conciliacao/importar-ofx`, axiosForm, {
      headers: { Cookie: "session=" + session },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })

    return NextResponse.json(res.data)
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? "Erro ao importar OFX"
    const status = error?.response?.status ?? 500
    return NextResponse.json({ message: msg }, { status })
  }
}
