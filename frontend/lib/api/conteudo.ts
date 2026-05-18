import { api } from "./client";
import type { Paginated } from "./types";

export interface Trilha {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  total_aulas: number;
  aulas_concluidas: number;
  progresso_pct: number;
}

export interface Aula {
  id: string;
  titulo: string;
  duracao_minutos: number | null;
  ordem: number;
  concluida: boolean;
}

export interface Modulo {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  aulas: Aula[];
}

export interface TrilhaDetalhe {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  progresso_pct: number;
  modulos: Modulo[];
}

export interface AulaDetalhe {
  id: string;
  modulo_id: string;
  titulo: string;
  descricao: string | null;
  drive_file_id: string;
  duracao_minutos: number | null;
  concluida: boolean;
  trilha: { id: string; titulo: string };
  proxima_aula: Aula | null;
}

export interface Comentario {
  id: string;
  usuario_id: string;
  autor_nome: string;
  autor_foto_url: string | null;
  texto: string | null;
  criado_em: string;
  editado_em: string | null;
  apagado_em: string | null;
  is_proprio: boolean;
}

interface ComentarioBackend {
  id: string;
  autor: { id: string; nome: string; foto_url: string | null };
  texto: string | null;
  criado_em: string;
  editado_em: string | null;
  apagado_em: string | null;
  is_proprio: boolean;
}

function mapComentario(c: ComentarioBackend): Comentario {
  return {
    id: c.id,
    usuario_id: c.autor.id,
    autor_nome: c.autor.nome,
    autor_foto_url: c.autor.foto_url,
    texto: c.texto,
    criado_em: c.criado_em,
    editado_em: c.editado_em,
    apagado_em: c.apagado_em,
    is_proprio: c.is_proprio,
  };
}

export async function listTrilhas(): Promise<Trilha[]> {
  const { data } = await api.get<Trilha[]>("/trilhas");
  return data;
}

export async function getTrilha(id: string): Promise<TrilhaDetalhe> {
  const { data } = await api.get<TrilhaDetalhe>(`/trilhas/${id}`);
  return data;
}

export async function getAula(id: string): Promise<AulaDetalhe> {
  const { data } = await api.get<AulaDetalhe>(`/aulas/${id}`);
  return data;
}

export async function concluirAula(id: string): Promise<void> {
  await api.post(`/aulas/${id}/concluir`);
}

export async function desmarcarAula(id: string): Promise<void> {
  await api.delete(`/aulas/${id}/concluir`);
}

export async function listComentarios(aulaId: string): Promise<Comentario[]> {
  const { data } = await api.get<Paginated<ComentarioBackend>>(`/aulas/${aulaId}/comentarios`);
  return data.items.map(mapComentario);
}

export async function createComentario(aulaId: string, texto: string): Promise<Comentario> {
  const { data } = await api.post<ComentarioBackend>(`/aulas/${aulaId}/comentarios`, { texto });
  return mapComentario(data);
}

export async function updateComentario(id: string, texto: string): Promise<Comentario> {
  const { data } = await api.patch<ComentarioBackend>(`/comentarios/${id}`, { texto });
  return mapComentario(data);
}

export async function deleteComentario(id: string): Promise<void> {
  await api.delete(`/comentarios/${id}`);
}
