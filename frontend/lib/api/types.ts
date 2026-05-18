export type Role = "cliente" | "admin";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  descricao: string | null;
  foto_url: string | null;
  role: Role;
  inativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
