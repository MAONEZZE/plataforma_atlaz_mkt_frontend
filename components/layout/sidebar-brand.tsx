"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api/types";

/**
 * Logo + wordmark. Componente puro, sem estado — usado tanto na <aside> fixa
 * do desktop quanto no <Sheet> do mobile.
 */
export function SidebarBrand({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const home = role === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <div className="flex h-14 shrink-0 items-center px-4">
      <Link
        href={home}
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none"
      >
        <Image
          src="/logos/reduzido/logo-verde.svg"
          alt="HUB"
          width={54}
          height={32}
          priority
          className={cn(
            // Aspecto real do SVG (194x116): sem letterbox, a caixa da imagem
            // é a própria marca, então o texto ao lado fica no mesmo nível.
            "h-5 w-auto shrink-0 ml-2 mt-4",
            // Colapsada não há texto e só cabem 32px de largura.
            collapsed && "w-8 object-contain",
          )}
        />
        <span
          className={cn(
            "truncate text-[10px] leading-none font-medium text-sidebar-primary mt-7",
            collapsed && "sr-only",
          )}
        >
          [ Keep the Cadence ]
        </span>
      </Link>
    </div>
  );
}
