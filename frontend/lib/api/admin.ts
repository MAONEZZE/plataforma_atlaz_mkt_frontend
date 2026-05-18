import { api } from "./client";
import type { Paginated } from "./types";

export interface AdminDashboardLinha {
  usuario_id: string;
  nome: string;
  foto_url: string | null;
  ligacoes_agendadas: number;
  ligacoes_realizadas: number;
  reunioes_agendadas: number;
  indicacoes: number;
  ultima_metrica_em: string | null;
}

export interface AdminAgregados {
  ligacoes_agendadas_total: number;
  ligacoes_realizadas_total: number;
  reunioes_agendadas_total: number;
  indicacoes_total: number;
  mentorados_com_metrica_no_mes: number;
  mentorados_sem_metrica_no_mes: number;
}

export interface AdminDashboardResponse extends Paginated<AdminDashboardLinha> {
  agregados: AdminAgregados;
}

export async function getAdminDashboard(params?: {
  mes?: string;
  busca?: string;
  page?: number;
  page_size?: number;
}): Promise<AdminDashboardResponse> {
  const { data } = await api.get<AdminDashboardResponse>("/admin/dashboard", { params });
  return data;
}

export interface TrilhaInput {
  titulo: string;
  descricao?: string | null;
  capa_url?: string | null;
}

export interface ModuloInput {
  trilha_id: string;
  titulo: string;
  descricao?: string | null;
}

export interface AulaInput {
  modulo_id: string;
  titulo: string;
  descricao?: string | null;
  drive_url: string;
  duracao_minutos?: number | null;
}

export interface ReordenarInput {
  ordem: { id: string; ordem: number }[];
}

export const adminTrilhas = {
  create: (input: TrilhaInput) => api.post("/admin/trilhas", input),
  update: (id: string, input: Partial<TrilhaInput>) =>
    api.patch(`/admin/trilhas/${id}`, input),
  remove: (id: string) => api.delete(`/admin/trilhas/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/trilhas/reordenar", input),
};

export const adminModulos = {
  create: (input: ModuloInput) => api.post("/admin/modulos", input),
  update: (id: string, input: Partial<ModuloInput>) =>
    api.patch(`/admin/modulos/${id}`, input),
  remove: (id: string) => api.delete(`/admin/modulos/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/modulos/reordenar", input),
};

export const adminAulas = {
  create: (input: AulaInput) => api.post("/admin/aulas", input),
  update: (id: string, input: Partial<AulaInput>) =>
    api.patch(`/admin/aulas/${id}`, input),
  remove: (id: string) => api.delete(`/admin/aulas/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/aulas/reordenar", input),
};
