import { api } from "./client";
import type { Paginated } from "./types";
import type { UserStage } from "./etapas";
import type { Produto } from "./produtos";

export interface AdminDashboardLinha {
  user_id: string;
  name: string;
  photo_url: string | null;
  calls_scheduled: number;
  calls_made: number;
  meetings_scheduled: number;
  referrals: number;
  last_metric_at: string | null;
  product_name?: string | null;
  product_id?: string | null;
}

export interface AdminAgregados {
  calls_scheduled_total: number;
  calls_made_total: number;
  meetings_scheduled_total: number;
  referrals_total: number;
  users_with_metric_in_month: number;
  users_without_metric_in_month: number;
}

export interface AdminDashboardResponse extends Paginated<AdminDashboardLinha> {
  aggregates: AdminAgregados;
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
  title: string;
  description?: string | null;
  cover_url?: string | null;
}

export interface ModuloInput {
  track_id: string;
  title: string;
  description?: string | null;
}

export interface AulaInput {
  module_id: string;
  title: string;
  description?: string | null;
  drive_url?: string;
  document_url?: string;
  is_doc: boolean;
  duration_minutes?: number | null;
}

export interface ReordenarInput {
  order: { id: string; order: number }[];
}

export const adminTrilhas = {
  create: (input: TrilhaInput) => api.post("/admin/tracks", input),
  update: (id: string, input: Partial<TrilhaInput>) =>
    api.patch(`/admin/tracks/${id}`, input),
  remove: (id: string) => api.delete(`/admin/tracks/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/tracks/reorder", input),
  uploadCover: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post<{ cover_url: string }>("/admin/tracks/cover", fd);
    return data.cover_url;
  },
};

export const adminModulos = {
  create: (input: ModuloInput) => api.post("/admin/modules", input),
  update: (id: string, input: Partial<ModuloInput>) =>
    api.patch(`/admin/modules/${id}`, input),
  remove: (id: string) => api.delete(`/admin/modules/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/modules/reorder", input),
};

export const adminAulas = {
  create: (input: AulaInput) => api.post("/admin/lessons", input),
  update: (id: string, input: Partial<AulaInput>) =>
    api.patch(`/admin/lessons/${id}`, input),
  remove: (id: string) => api.delete(`/admin/lessons/${id}`),
  reordenar: (input: ReordenarInput) => api.post("/admin/lessons/reorder", input),
  uploadDocument: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("document", file);
    const { data } = await api.post<{ document_url: string }>("/admin/lessons/document", fd);
    return data.document_url;
  },
};

export interface ClienteInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface ClienteLinha {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at?: string;
  product_name?: string | null;
  product_id?: string | null;
}

export const adminClientes = {
  create: async (input: ClienteInput) => {
    const { data } = await api.post("/admin/clients", input);
    return data;
  },
  list: async (params?: { page?: number; page_size?: number; busca?: string }): Promise<Paginated<ClienteLinha>> => {
    const { data } = await api.get<Paginated<ClienteLinha>>("/admin/clients", { params });
    return data;
  },
};

export interface Stage {
  id: string;
  text: string;
  created_at: string;
}

export const adminStages = {
  list: async (): Promise<Stage[]> => {
    const { data } = await api.get<Stage[]>("/admin/stages");
    return data;
  },
  create: async (text: string): Promise<Stage> => {
    const { data } = await api.post<Stage>("/admin/stages", { text });
    return data;
  },
  update: async (id: string, text: string): Promise<Stage> => {
    const { data } = await api.patch<Stage>(`/admin/stages/${id}`, { text });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/stages/${id}`);
  },
  attachToClient: async (user_id: string, stage_id: string): Promise<UserStage> => {
    const { data } = await api.post<UserStage>(
      `/admin/clients/${user_id}/stages/${stage_id}`,
    );
    return data;
  },
  detachFromClient: async (user_id: string, stage_id: string): Promise<void> => {
    await api.delete(`/admin/clients/${user_id}/stages/${stage_id}`);
  },
  getClientStages: async (user_id: string): Promise<UserStage[]> => {
    const { data } = await api.get<UserStage[]>(`/admin/clients/${user_id}/stages`);
    return data;
  },
};

export interface ProdutoInput {
  name: string;
  value: number;
  description?: string | null;
}

export const adminProdutos = {
  create: async (input: ProdutoInput): Promise<Produto> => {
    const { data } = await api.post<Produto>("/admin/products", input);
    return data;
  },
  update: async (id: string, input: Partial<ProdutoInput>): Promise<Produto> => {
    const { data } = await api.patch<Produto>(`/admin/products/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/products/${id}`);
  },
  assignToClient: async (user_id: string, product_id: string): Promise<void> => {
    await api.patch(`/admin/clients/${user_id}/product`, { product_id });
  },
};
