import { NextRequest, NextResponse } from "next/server";
import { API_URL, WATER_DESIGN_URL } from "./constants";

export const runtime = "nodejs";

const STATUS_TIMEOUT_MS = 4_000;

async function isSessionValid(sessionCookie: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/status`, {
      headers: { "Content-Type": "application/json", Cookie: `session=${sessionCookie}` },
      signal: controller.signal,
      cache: "no-store",
    });
    return response.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function middleware(request: NextRequest) {
  const prod = process.env.NODE_ENV === "production";
  const loginUrl = `${WATER_DESIGN_URL}/login`;
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    if (!prod) return NextResponse.next();
    return NextResponse.redirect(loginUrl);
  }

  const valid = await isSessionValid(sessionCookie);
  if (valid) return NextResponse.next();
  if (!prod) return NextResponse.next();
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
