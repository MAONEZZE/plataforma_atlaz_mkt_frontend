import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy"): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern, { locale: ptBR });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}
