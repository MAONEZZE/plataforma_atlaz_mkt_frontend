import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Segunda-feira da semana de `date` (ISO week start). */
export function mondayOf(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** "Semana de DD/MM a DD/MM" — recebe a segunda. */
export function formatWeekRange(monday: Date | string): string {
  const m = typeof monday === "string" ? parseISO(monday) : monday;
  const sunday = addDays(m, 6);
  return `Semana de ${format(m, "dd/MM", { locale: ptBR })} a ${format(sunday, "dd/MM", { locale: ptBR })}`;
}

/** Diferença em semanas inteiras entre `to` e `from` (monday-aligned). */
export function weeksBetween(from: Date | string, to: Date | string): number {
  const a = mondayOf(typeof from === "string" ? parseISO(from) : from);
  const b = mondayOf(typeof to === "string" ? parseISO(to) : to);
  return Math.round((b.getTime() - a.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/** Verdade se a semana está dentro da janela de edição de 4 semanas. */
export function withinEditWindow(weekStart: Date | string, today: Date = new Date()): boolean {
  return weeksBetween(weekStart, today) <= 4;
}
