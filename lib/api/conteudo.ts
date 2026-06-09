import { api } from "./client";
import type { Paginated } from "./types";

export interface Trilha {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  order: number;
  total_lessons: number;
  lessons_completed: number;
  progress_pct: number;
}

export interface Aula {
  id: string;
  title: string;
  duration_minutes: number | null;
  order: number;
  completed: boolean;
  is_doc?: boolean;
}

export interface Modulo {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Aula[];
}

export interface TrilhaDetalhe {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  progress_pct: number;
  modules: Modulo[];
}

export interface AulaDetalhe {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  drive_file_id: string | null;
  document_url: string | null;
  is_doc: boolean;
  duration_minutes: number | null;
  completed: boolean;
  track: { id: string; title: string };
  next_lesson: Aula | null;
}

export interface CommentAuthor {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface Comentario {
  id: string;
  author: CommentAuthor;
  text: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_own: boolean;
}

export async function listTrilhas(): Promise<Trilha[]> {
  const { data } = await api.get<Trilha[]>("/tracks");
  return data;
}

export async function getTrilha(id: string): Promise<TrilhaDetalhe> {
  const { data } = await api.get<TrilhaDetalhe>(`/tracks/${id}`);
  return data;
}

export async function getAula(id: string): Promise<AulaDetalhe> {
  const { data } = await api.get<AulaDetalhe>(`/lessons/${id}`);
  return data;
}

export async function concluirAula(id: string): Promise<void> {
  await api.post(`/lessons/${id}/complete`);
}

export async function desmarcarAula(id: string): Promise<void> {
  await api.delete(`/lessons/${id}/complete`);
}

export async function listComentarios(aulaId: string): Promise<Comentario[]> {
  const { data } = await api.get<Paginated<Comentario>>(`/lessons/${aulaId}/comments`);
  return data.items;
}

export async function createComentario(aulaId: string, text: string): Promise<Comentario> {
  const { data } = await api.post<Comentario>(`/lessons/${aulaId}/comments`, { text });
  return data;
}

export async function updateComentario(id: string, text: string): Promise<Comentario> {
  const { data } = await api.patch<Comentario>(`/comments/${id}`, { text });
  return data;
}

export async function deleteComentario(id: string): Promise<void> {
  await api.delete(`/comments/${id}`);
}
