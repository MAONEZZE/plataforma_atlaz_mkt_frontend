"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/store";
import type { Usuario } from "@/lib/api/types";

export function AuthHydration({ user }: { user: Usuario }) {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);
  return null;
}
