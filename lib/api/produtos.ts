import { api } from "./client";

export interface Produto {
  id: string;
  name: string;
  value: number;
  description: string | null;
  created_at: string;
}

export async function listProdutos(): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>("/products");
  return data;
}

export async function getProduto(id: string): Promise<Produto> {
  const { data } = await api.get<Produto>(`/products/${id}`);
  return data;
}
