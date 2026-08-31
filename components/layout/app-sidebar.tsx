"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import type { Role } from "@/lib/api/types";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";

export function AppSidebar({ role }: { role: Role }) {
  const { collapsed, toggle, mounted } = useSidebarState();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        // A transição só entra depois de montar, para o estado restaurado do
        // localStorage não animar no primeiro paint.
        mounted && "transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarBrand role={role} collapsed={collapsed} />

      <div id="app-sidebar-nav" className="flex-1 overflow-y-auto py-2">
        <SidebarNav role={role} collapsed={collapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-nav"
          className="flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className={cn(collapsed && "sr-only")}>Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}
