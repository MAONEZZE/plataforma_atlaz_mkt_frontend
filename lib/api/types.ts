export type Role = "cliente" | "admin";

export interface Usuario {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  description: string | null;
  photo_url: string | null;
  role: Role;
  product_name?: string | null;
  product_id?: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}
