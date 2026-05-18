import { api } from "./client";
import type { Paginated } from "./types";

export interface MetricaSemanal {
  id: string;
  usuario_id: string;
  semana_inicio: string;
  ligacoes_agendadas: number;
  ligacoes_realizadas: number;
  reunioes_agendadas: number;
  indicacoes: number;
  criado_em: string;
  atualizado_em: string;
}

export interface MetricaInput {
  semana_inicio: string;
  ligacoes_agendadas: number;
  ligacoes_realizadas: number;
  reunioes_agendadas: number;
  indicacoes: number;
}

export async function listMetricas(params?: {
  usuario_id?: string;
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
  valor: number;
  delta_pct: number | null;
}

export interface DashboardResumo {
  mes: string;
  ligacoes_agendadas: DeltaOut;
  ligacoes_realizadas: DeltaOut;
  reunioes_agendadas: DeltaOut;
  indicacoes: DeltaOut;
}

export async function getDashboardResumo(): Promise<DashboardResumo> {
  const { data } = await api.get<DashboardResumo>("/dashboard/resumo");
  return data;
}

export interface SeriePoint {
  semana: string;
  ligacoes_agendadas: number;
  ligacoes_realizadas: number;
  reunioes_agendadas: number;
  indicacoes: number;
}

export async function getDashboardSeries(): Promise<SeriePoint[]> {
  const { data } = await api.get<{ series: SeriePoint[] }>("/dashboard/series");
  return data.series;
}
