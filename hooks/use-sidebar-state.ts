"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

/* localStorage envolvido em try/catch: SSR e modo privado. */
function getDraft<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function setDraft(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota cheia ou storage bloqueado: o colapso simplesmente não persiste */
  }
}

export function useSidebarState() {
  // Sempre `false` no servidor e no primeiro render do cliente. A leitura do
  // localStorage acontece no useEffect — sem mismatch de hidratação.
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getDraft<boolean>(STORAGE_KEY);
    // O localStorage não existe no SSR: ler aqui é justamente o que evita o
    // mismatch de hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setCollapsed(stored);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      setDraft(STORAGE_KEY, next);
      return next;
    });
  }

  return { collapsed, toggle, mounted };
}
