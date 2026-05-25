"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "./UserDropdown";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const clientLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trilhas", label: "Trilhas" },
  { href: "/comunidade", label: "Comunidade" },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/trilhas", label: "Gerenciar Trilhas" },
  { href: "/trilhas", label: "Trilhas" },
  { href: "/comunidade", label: "Comunidade" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
          <Image src="/logo.svg" alt="Atlaz" width={90} height={32} priority />
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
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
                {links.map((l) => (
                  <NavLink key={l.href} {...l} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
