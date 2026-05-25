import { api } from "./client";
import type { Paginated } from "./types";

export interface MetricaSemanal {
  id: string;
  user_id: string;
  week_start: string;
  calls_scheduled: number;
  calls_made: number;
  meetings_scheduled: number;
  referrals: number;
  created_at: string;
  updated_at: string;
}

export interface MetricaInput {
  week_start: string;
  calls_scheduled: number;
  calls_made: number;
  meetings_scheduled: number;
  referrals: number;
}

export async function listMetricas(params?: {
  user_id?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<MetricaSemanal>> {
  const { data } = await api.get<Paginated<MetricaSemanal>>("/metricas", { params });
  return data;
}

export async function createMetrica(input: MetricaInput): Promise<MetricaSemanal> {
  const { data } = await api.post<MetricaSemanal>("/metricas", input);
  return data;
}

export async function updateMetrica(
  id: string,
  input: Partial<MetricaInput>,
): Promise<MetricaSemanal> {
  const { data } = await api.patch<MetricaSemanal>(`/metricas/${id}`, input);
  return data;
}

export interface DeltaOut {
  value: number;
  delta_pct: number | null;
}

export interface DashboardResumo {
  month: string;
  calls_scheduled?: DeltaOut;
  calls_made?: DeltaOut;
  meetings_scheduled?: DeltaOut;
  referrals?: DeltaOut;
}

export async function getDashboardResumo(): Promise<DashboardResumo> {
  const { data } = await api.get<DashboardResumo>("/dashboard/resumo");
  return data;
}

export interface SeriePoint {
  week: string;
  calls_scheduled?: number;
  calls_made?: number;
  meetings_scheduled?: number;
  referrals?: number;
}

export async function getDashboardSeries(): Promise<SeriePoint[]> {
  const { data } = await api.get<{ series: SeriePoint[] }>("/dashboard/series");
  return data.series;
}
