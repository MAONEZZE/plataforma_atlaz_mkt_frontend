import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

export function getCalendarYear(): number {
  const raw = process.env.NEXT_PUBLIC_ANO_CALENDARIO;
  const year = Number(raw);
  return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear();
}

export function getEventosSet(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_PROXIMOS_EVENTOS;
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.map((s) => normalizeKey(s)));
  } catch {
    return new Set();
  }
}

function normalizeKey(ddMM: string): string {
  const [d, m] = ddMM.split(";").map(Number);
  return `${d}-${m}`;
}

export function dayKey(day: number, month: number): string {
  return `${day}-${month}`;
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
