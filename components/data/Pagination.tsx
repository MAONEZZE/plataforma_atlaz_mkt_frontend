"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 50, 100];

/**
 * Teleporta a paginação para o footer fixo do AppShell.
 * `inline` desliga o portal para tabelas que vivem dentro de outro fluxo
 * (ex.: um formulário), onde a paginação deve ficar colada na tabela.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  inline = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  inline?: boolean;
}) {
  const [footer, setFooter] = useState<HTMLElement | null>(null);

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  useEffect(() => {
    if (inline) return;
    // O nó do portal só existe no cliente, depois do AppShell montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFooter(document.getElementById("dashboard-pagination-footer"));
  }, [inline]);

  const pagination = (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        {safePage}/{safeTotalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={safePage >= safeTotalPages}
        onClick={() => onPageChange(safePage + 1)}
      >
        Próxima
      </Button>
    </div>
  );

  // Enquanto o nó não é encontrado, renderiza inline — sem flash de layout.
  return footer ? createPortal(pagination, footer) : pagination;
}

/** Fica no toolbar da página, não no footer. Resetar a página é do chamador. */
export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => { if (v !== null) onChange(Number(v)); }}>
      <SelectTrigger className="w-20" aria-label="Itens por página">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAGE_SIZES.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
