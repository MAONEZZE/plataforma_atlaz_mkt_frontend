import { api } from "./client";

export interface MetricOut {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface EntryOut {
  metric_id: string;
  day: string;
  value: number;
  updated_at: string;
}

export interface SheetOut {
  month: string;
  columns: MetricOut[];
  days: string[];
  entries: Record<string, Record<string, number>>;
}

export interface MetricInput {
  name: string;
  unit?: string;
}

export interface MetricPatch {
  name?: string;
  unit?: string;
  order?: number;
}

export function getCellValue(sheet: SheetOut, metricId: string, day: string): number | undefined {
  return sheet.entries[metricId]?.[day];
}

export async function listMetricColumns(): Promise<MetricOut[]> {
  const { data } = await api.get<MetricOut[]>("/metricas");
  return data;
}

export async function createMetricColumn(input: MetricInput): Promise<MetricOut> {
  const { data } = await api.post<MetricOut>("/metricas", input);
  return data;
}

export async function updateMetricColumn(id: string, input: MetricPatch): Promise<MetricOut> {
  const { data } = await api.patch<MetricOut>(`/metricas/${id}`, input);
  return data;
}

export async function deleteMetricColumn(id: string): Promise<void> {
  await api.delete(`/metricas/${id}`);
}

export async function getSheet(mes?: string): Promise<SheetOut> {
  const { data } = await api.get<SheetOut>("/metricas/planilha", { params: mes ? { mes } : undefined });
  return data;
}

export async function putCell(metricaId: string, dia: string, value: number): Promise<EntryOut> {
  const { data } = await api.put<EntryOut>(`/metricas/${metricaId}/valores/${dia}`, { value });
  return data;
}

export async function deleteCell(metricaId: string, dia: string): Promise<void> {
  await api.delete(`/metricas/${metricaId}/valores/${dia}`);
}
