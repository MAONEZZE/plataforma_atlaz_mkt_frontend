"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const clientLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trilhas", label: "Trilhas" },
  { href: "/comunidade", label: "Comunidade" },
];

const adminLinks = [
  { href: "/admin/trilhas", label: "Gerenciar Trilhas" },
  { href: "/admin/dashboard", label: "Dashboard Admin" },
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
    ? [...clientLinks, ...adminLinks]
    : clientLinks;

  if (!user) return null;

  return (
    <header className="glass sticky top-0 z-40 w-full border-b border-border/60" style={{ borderRadius: 0 }}>
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
