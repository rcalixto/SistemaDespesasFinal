import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = numValue != null && !isNaN(numValue) ? numValue : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
}

export function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) ? numValue : 0;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}
