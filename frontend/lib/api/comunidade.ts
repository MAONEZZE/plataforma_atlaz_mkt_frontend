import { api } from "./client";
import type { Paginated } from "./types";

export interface MentoradoPublico {
  id: string;
  nome: string;
  foto_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  descricao: string | null;
}

export async function listComunidade(params?: {
  page?: number;
  page_size?: number;
}): Promise<Paginated<MentoradoPublico>> {
  const { data } = await api.get<Paginated<MentoradoPublico>>("/comunidade", { params });
  return data;
}
