"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDropdown } from "./UserDropdown";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

type NavItem =
  | { type: "link"; href: string; label: string; isActive?: (pathname: string) => boolean }
  | { type: "dropdown"; label: string; matchPrefixes: string[]; items: { href: string; label: string }[] };

const CLIENT_DETAIL_PATH = /^\/admin\/clientes\/[^/]+$/;

const clientLinks: NavItem[] = [
  { type: "link", href: "/dashboard", label: "Dashboard" },
  { type: "link", href: "/trilhas", label: "Trilhas" },
  { type: "link", href: "/produto", label: "Produto" },
  { type: "link", href: "/etapa", label: "Etapas" },
  { type: "link", href: "/comunidade", label: "Comunidade" },
  { type: "link", href: "/calendario", label: "Calendário" },
];

const adminLinks: NavItem[] = [
  {
    type: "link",
    href: "/admin/dashboard",
    label: "Dashboard",
    isActive: (p) => p === "/admin/dashboard" || CLIENT_DETAIL_PATH.test(p),
  },
  { type: "link", href: "/admin/clientes", label: "Clientes", isActive: (p) => p === "/admin/clientes" },
  { type: "link", href: "/admin/produtos", label: "Produtos" },
  {
    type: "dropdown",
    label: "Etapas",
    matchPrefixes: ["/admin/etapas", "/etapa"],
    items: [
      { href: "/admin/etapas", label: "Gerenciar Etapas" },
      { href: "/etapa", label: "Visualizar Etapas" },
    ],
  },
  {
    type: "dropdown",
    label: "Trilhas",
    matchPrefixes: ["/admin/trilhas", "/trilhas"],
    items: [
      { href: "/admin/trilhas", label: "Gerenciar Trilhas" },
      { href: "/trilhas", label: "Visualizar Trilhas" },
    ],
  },
  { type: "link", href: "/comunidade", label: "Comunidade" },
  { type: "link", href: "/calendario", label: "Calendário" },
];

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive?: (pathname: string) => boolean;
}) {
  const pathname = usePathname();
  const active = isActive
    ? isActive(pathname)
    : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors border-b-2 pb-0.5",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
      )}
    >
      {label}
    </Link>
  );
}

function NavDropdown({
  label,
  items,
  matchPrefixes,
}: {
  label: string;
  items: { href: string; label: string }[];
  matchPrefixes: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = matchPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname === p,
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors border-b-2 pb-0.5 focus:outline-none cursor-pointer",
          active
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
        )}
      >
        {label}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="solid-surface w-48 border border-border shadow-md">
        {items.map((it) => (
          <DropdownMenuItem
            key={it.href}
            onClick={() => router.push(it.href)}
            className="cursor-pointer"
          >
            {it.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItemRender({ item }: { item: NavItem }) {
  if (item.type === "link") return <NavLink href={item.href} label={item.label} isActive={item.isActive} />;
  return <NavDropdown label={item.label} items={item.items} matchPrefixes={item.matchPrefixes} />;
}

export function Navbar() {
  const user = useCurrentUser();
  const links = user?.role === "admin"
    ? adminLinks
    : clientLinks;

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const TOP_THRESHOLD = 10;
    const HOVER_REVEAL_Y = 80;

    function onScroll() {
      const y = window.scrollY;
      if (y < TOP_THRESHOLD) {
        setVisible(true);
      } else if (y > lastScrollY.current) {
        setVisible(false);
      } else if (y < lastScrollY.current) {
        setVisible(true);
      }
      lastScrollY.current = y;
    }

    function onMouseMove(e: MouseEvent) {
      if (e.clientY < HOVER_REVEAL_Y) setVisible(true);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  if (!user) return null;

  return (
    <header
      className={cn(
        "glass fixed top-0 z-40 w-full border-b border-border/60 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      style={{ borderRadius: 0 }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0">
          <Image src="/Atlaz.png" alt="Atlaz" width={32} height={32} priority className="rounded-lg" />
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavItemRender key={l.type === "link" ? l.href : `dd-${l.label}`} item={l} />
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <UserDropdown user={user} />

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="glass w-64 pt-10">
              <nav className="flex flex-col gap-4 mt-4">
                {links.flatMap((l) =>
                  l.type === "link"
                    ? [<NavLink key={l.href} href={l.href} label={l.label} isActive={l.isActive} />]
                    : l.items.map((sub) => (
                        <NavLink key={`${l.label}-${sub.href}`} href={sub.href} label={sub.label} />
                      )),
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
