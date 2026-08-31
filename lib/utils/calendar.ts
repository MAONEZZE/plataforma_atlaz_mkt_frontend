import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

export function getCalendarYear(): number {
  const raw = process.env.NEXT_PUBLIC_ANO_CALENDARIO;
  const year = Number(raw);
  return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear();
}

export function groupByDate<T extends { date: string }>(events: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const event of events) {
    const list = map.get(event.date);
    if (list) list.push(event);
    else map.set(event.date, [event]);
  }
  return map;
}

export function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface MonthCell {
  day: number | null;
}

export function getMonthCells(year: number, monthIndex: number): MonthCell[] {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end }).map((d) => d.getDate());
  const leadingBlanks = getDay(start); // 0 = Sunday
  return [
    ...Array.from({ length: leadingBlanks }, () => ({ day: null })),
    ...days.map((day) => ({ day })),
  ];
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
