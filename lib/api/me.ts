import { api } from "./client";
import type { Usuario } from "./types";

export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/me");
  return data;
}

export interface UpdateMeInput {
  name?: string;
  phone?: string | null;
  linkedin_url?: string | null;
  instagram_username?: string | null;
  description?: string | null;
}

export async function updateMe(input: UpdateMeInput): Promise<Usuario> {
  const { data } = await api.patch<Usuario>("/me", input);
  return data;
}

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function uploadFoto(file: File): Promise<{ photo_url: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type || EXT_MIME[ext] || "image/jpeg";
  const fd = new FormData();
  fd.append("photo", file.slice(0, file.size, mimeType), file.name);
  const { data } = await api.post<{ photo_url: string }>("/me/photo", fd);
  return data;
}
