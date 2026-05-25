import { create } from "zustand";
import type { Usuario } from "@/lib/api/types";

interface AuthState {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
