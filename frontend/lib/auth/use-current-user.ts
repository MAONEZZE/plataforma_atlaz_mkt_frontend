"use client";

import { useAuthStore } from "./store";
import type { Usuario } from "@/lib/api/types";

export function useCurrentUser(): Usuario | null {
  return useAuthStore((s) => s.user);
}

export function useRequireUser(): Usuario {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    throw new Error("useRequireUser chamado fora do layout autenticado.");
  }
  return user;
}
