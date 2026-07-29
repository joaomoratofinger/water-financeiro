const prod = process.env.NODE_ENV === "production";

export const API_URL = prod
  ? "https://arquitetura-api.waterdesign.com.br"
  : (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:3000");

export const WATER_DESIGN_URL = prod
  ? "https://comercial.waterdesign.com.br"
  : "http://localhost:4200";
