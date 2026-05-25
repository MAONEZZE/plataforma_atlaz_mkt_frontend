import { api } from "./client";
import type { Paginated } from "./types";

export interface MentoradoPublico {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  description: string | null;
}

export async function listComunidade(params?: {
  page?: number;
  page_size?: number;
}): Promise<Paginated<MentoradoPublico>> {
  const { data } = await api.get<Paginated<MentoradoPublico>>("/community", { params });
  return data;
}
