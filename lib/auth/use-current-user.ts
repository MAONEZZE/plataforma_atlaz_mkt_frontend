"use client";

import { useAuthStore } from "./store";
import type { Usuario } from "@/lib/api/types";

export function useCurrentUser(): Usuario | null {
  return useAuthStore((s) => s.user);
}
