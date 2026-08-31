import { api } from "./client";
import type { Paginated } from "./types";

export interface EventOut {
  id: string;
  client_id: string | null;
  title: string;
  date: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventoCliente {
  id: string;
  title: string;
  date: string;
  description: string | null;
  image_url: string | null;
  is_global: boolean;
}

export interface EventoInput {
  title: string;
  date: string;
  description?: string | null;
  client_id?: string | null;
}

export type ClearScope = "general" | "clients" | "all";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const PAGE_SIZE = 100;

async function listAll<T>(url: string): Promise<Paginated<T>> {
  const items: T[] = [];
  let page = 1;
  let total = 0;
  do {
    const { data } = await api.get<Paginated<T>>(url, { params: { page, page_size: PAGE_SIZE } });
    items.push(...data.items);
    total = data.total;
    page += 1;
  } while (items.length < total && items.length > 0);
  return { items, page: 1, page_size: items.length, total };
}

export const eventos = {
  list: (): Promise<Paginated<EventoCliente>> => listAll<EventoCliente>("/events"),
};

export const adminEventos = {
  list: (): Promise<Paginated<EventOut>> => listAll<EventOut>("/admin/events"),
  create: async (input: EventoInput): Promise<EventOut> => {
    const { data } = await api.post<EventOut>("/admin/events", input);
    return data;
  },
  update: async (id: string, input: Partial<EventoInput>): Promise<EventOut> => {
    const { data } = await api.patch<EventOut>(`/admin/events/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/events/${id}`);
  },
  uploadImage: async (id: string, file: File): Promise<{ image_url: string }> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = file.type || EXT_MIME[ext] || "image/jpeg";
    const fd = new FormData();
    fd.append("image", file.slice(0, file.size, mimeType), file.name);
    const { data } = await api.post<{ image_url: string }>(`/admin/events/${id}/image`, fd);
    return data;
  },
  clearYear: async (year: number, scope: ClearScope): Promise<{ deleted: number }> => {
    const { data } = await api.delete<{ deleted: number }>("/admin/events", {
      params: { year, scope },
    });
    return data;
  },
};
