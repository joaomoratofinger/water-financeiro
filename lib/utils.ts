import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  } catch {
    return "-";
  }
}
