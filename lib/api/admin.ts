import { api } from "./client";
import type { Paginated } from "./types";
import type { UserStage } from "./etapas";
import type { Produto } from "./produtos";
import type { SheetOut } from "./metricas";
import type { EventoCliente } from "./eventos";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function getClientSheet(userId: string, mes?: string): Promise<SheetOut> {
  const { data } = await api.get<SheetOut>(`/admin/clients/${userId}/metricas/planilha`, {
    params: mes ? { mes } : undefined,
  });
  return data;
}

export interface TrilhaInput {
  title: string;
  description?: string | null;
  cover_url?: string | null;
  order?: number;
}

export interface ModuloInput {
  track_id: string;
  title: string;
  description?: string | null;
  order?: number;
}

export interface AulaInput {
  module_id: string;
  title: string;
  description?: string | null;
  drive_url?: string;
  document_url?: string;
  is_doc: boolean;
  duration_minutes?: number | null;
  order?: number;
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
  uploadDocument: async (file: File, title: string): Promise<string> => {
    const fd = new FormData();
    fd.append("document", file);
    fd.append("title", title);
    const { data } = await api.post<{ document_url: string }>("/admin/lessons/document", fd);
    return data.document_url;
  },
};

export interface ClienteInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  description?: string | null;
  product_id?: string | null;
  stage_ids?: string[];
}

export interface ClienteUpdateInput {
  name?: string | null;
  phone?: string | null;
  description?: string | null;
  product_id?: string | null;
  stage_ids?: string[] | null;
}

export interface ClienteCreateResponse {
  id: string;
  name: string;
  email: string;
  product_id: string | null;
  product_name: string | null;
}

export interface ClienteUpdateResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  product_id: string | null;
  product_name: string | null;
}

export interface ClienteStage {
  stage_id: string;
  title: string | null;
  text: string;
  done: boolean;
}

export interface ClienteLinha {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  product_name: string | null;
  product_id: string | null;
  photo_url?: string | null;
  created_at: string;
  stages: ClienteStage[];
}

// AdminClientDetailResponse overlaps Usuario's profile fields but is kept as its own
// type since it's an admin-only response contract (has created_at/stages, no session semantics).
export interface AdminClientDetailResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  description: string | null;
  photo_url: string | null;
  role: "cliente" | "admin";
  product_id: string | null;
  product_name: string | null;
  created_at: string;
  stages: ClienteStage[];
  events: EventoCliente[];
}

export const adminClientes = {
  create: async (input: ClienteInput): Promise<ClienteCreateResponse> => {
    const { data } = await api.post<ClienteCreateResponse>("/admin/clients", input);
    return data;
  },
  update: async (id: string, input: ClienteUpdateInput): Promise<ClienteUpdateResponse> => {
    const { data } = await api.patch<ClienteUpdateResponse>(`/admin/clients/${id}`, input);
    return data;
  },
  list: async (params?: {
    page?: number;
    page_size?: number;
    busca?: string;
    ordenar?: "name" | "created_at";
    direcao?: "asc" | "desc";
  }): Promise<Paginated<ClienteLinha>> => {
    const { data } = await api.get<Paginated<ClienteLinha>>("/admin/clients", { params });
    return data;
  },
  get: async (id: string): Promise<AdminClientDetailResponse> => {
    const { data } = await api.get<AdminClientDetailResponse>(`/admin/clients/${id}`);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/clients/${id}`);
  },
  uploadPhoto: async (id: string, file: File): Promise<{ photo_url: string }> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = file.type || EXT_MIME[ext] || "image/jpeg";
    const fd = new FormData();
    fd.append("photo", file.slice(0, file.size, mimeType), file.name);
    const { data } = await api.post<{ photo_url: string }>(`/admin/clients/${id}/photo`, fd);
    return data;
  },
};

export interface StageFolder {
  id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface StageFolderInput {
  title: string;
  order?: number;
}

export const adminStageFolders = {
  list: async (): Promise<StageFolder[]> => {
    const { data } = await api.get<StageFolder[]>("/admin/stage-folders");
    return data;
  },
  create: async (input: StageFolderInput): Promise<StageFolder> => {
    const { data } = await api.post<StageFolder>("/admin/stage-folders", input);
    return data;
  },
  update: async (id: string, input: Partial<StageFolderInput>): Promise<StageFolder> => {
    const { data } = await api.patch<StageFolder>(`/admin/stage-folders/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/stage-folders/${id}`);
  },
};

export interface Stage {
  id: string;
  text: string;
  title: string | null;
  folder_id: string | null;
  order: number;
  created_at: string;
}

// PATCH /admin/stages/{id} overwrites the whole object — always send the full
// StageInput (folder_id + order included), never a bare partial, or it silently
// nulls out the stage's folder/order.
export interface StageInput {
  text: string;
  title: string | null;
  folder_id: string | null;
  order: number;
}

export const adminStages = {
  list: async (): Promise<Stage[]> => {
    const { data } = await api.get<Stage[]>("/admin/stages");
    return data;
  },
  create: async (input: StageInput): Promise<Stage> => {
    const { data } = await api.post<Stage>("/admin/stages", input);
    return data;
  },
  update: async (id: string, input: StageInput): Promise<Stage> => {
    const { data } = await api.patch<Stage>(`/admin/stages/${id}`, input);
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
  cover_photo?: string | null;
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
  assignToClient: async (user_id: string, product_id: string | null): Promise<void> => {
    await api.patch(`/admin/clients/${user_id}/product`, { product_id });
  },
};
