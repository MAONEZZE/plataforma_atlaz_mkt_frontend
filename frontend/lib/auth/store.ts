import { create } from "zustand";
import type { Usuario } from "@/lib/api/types";

interface AuthState {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  patchUser: (partial: Partial<Usuario>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  patchUser: (partial) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },
  clear: () => set({ user: null }),
}));
