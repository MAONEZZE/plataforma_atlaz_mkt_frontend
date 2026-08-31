"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Eye,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings2,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive } from "@/lib/utils/nav";
import type { Role } from "@/lib/api/types";

interface NavLeaf {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Um único nível de aninhamento: "Etapas" > Gerenciar / Visualizar. */
interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
}

type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export const sidebarNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trilhas", label: "Trilhas", icon: GraduationCap },
  { href: "/produto", label: "Produto", icon: Package },
  { href: "/etapa", label: "Etapas", icon: ListChecks },
  { href: "/comunidade", label: "Comunidade", icon: UsersRound },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
];

export const adminSidebarNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  {
    label: "Etapas",
    icon: ListChecks,
    children: [
      { href: "/admin/etapas", label: "Gerenciar", icon: Settings2 },
      { href: "/etapa", label: "Visualizar", icon: Eye },
    ],
  },
  {
    label: "Trilhas",
    icon: GraduationCap,
    children: [
      { href: "/admin/trilhas", label: "Gerenciar", icon: Settings2 },
      { href: "/trilhas", label: "Visualizar", icon: Eye },
    ],
  },
  { href: "/comunidade", label: "Comunidade", icon: UsersRound },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
];

const linkBase =
  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none";

function NavLinkRow({
  item,
  active,
  collapsed,
  onNavigate,
  title,
  nested = false,
}: {
  item: NavLeaf;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  title?: string;
  nested?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? (title ?? item.label) : undefined}
      className={cn(
        linkBase,
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        collapsed && "justify-center px-2",
        // Sub-item: recuado e um pouco mais leve que o item de topo.
        nested && !collapsed && "ml-3 font-normal",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn(collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );
}

function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.children.some((child) => isActive(pathname, child.href));
}

/**
 * Lista de navegação. Serve a sidebar do desktop e o drawer do mobile. Os
 * grupos (Trilhas/Etapas) funcionam como drawers: clicar no cabeçalho
 * expande/recolhe as sub-abas, abrindo por padrão o grupo da rota ativa.
 */
export function SidebarNav({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? adminSidebarNavItems : sidebarNavItems;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      if (isGroup(item)) {
        initial[item.label] = isGroupActive(pathname, item);
      }
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <nav aria-label="Navegação principal" className="mt-5 flex flex-col gap-2 px-5">
      {items.map((item) => {
        if (!isGroup(item)) {
          return (
            <NavLinkRow
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        }

        // Colapsada não há espaço para hierarquia: os sub-itens viram linhas
        // próprias, distinguidos pelo ícone e pelo title.
        if (collapsed) {
          return item.children.map((child) => (
            <NavLinkRow
              key={child.href}
              item={child}
              active={isActive(pathname, child.href)}
              collapsed
              onNavigate={onNavigate}
              title={`${item.label} · ${child.label}`}
            />
          ));
        }

        const GroupIcon = item.icon;
        const open = openGroups[item.label] ?? false;
        return (
          <div key={item.label} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleGroup(item.label)}
              aria-expanded={open}
              className={cn(
                linkBase,
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
              />
            </button>
            {open &&
              item.children.map((child) => (
                <NavLinkRow
                  key={child.href}
                  item={child}
                  active={isActive(pathname, child.href)}
                  collapsed={false}
                  onNavigate={onNavigate}
                  nested
                />
              ))}
          </div>
        );
      })}
    </nav>
  );
}
