import { api } from "./client";
import type { Usuario } from "./types";

export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/me");
  return data;
}

export interface UpdateMeInput {
  nome?: string;
  telefone?: string | null;
  linkedin_url?: string | null;
  instagram_username?: string | null;
  descricao?: string | null;
}

export async function updateMe(input: UpdateMeInput): Promise<Usuario> {
  const { data } = await api.patch<Usuario>("/me", input);
  return data;
}

export async function uploadFoto(file: File): Promise<Usuario> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<Usuario>("/me/foto", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
