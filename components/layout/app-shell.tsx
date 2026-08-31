"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/auth/store";
import type { Usuario } from "@/lib/api/types";
import { AppSidebar } from "./app-sidebar";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";

/** Iniciais: primeiras letras das duas primeiras palavras do nome. */
function initials(name: string, email: string): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (fromName) return fromName;
  if (email) return email[0].toUpperCase();
  return "?";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // O tema resolvido só é conhecido no cliente; o flag de mount evita o
  // mismatch de hidratação.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // O label também precisa esperar o mount: no servidor resolvedTheme é
      // undefined, e um label diferente no cliente quebra a hidratação.
      aria-label={
        !mounted ? "Alternar tema" : isDark ? "Ativar tema claro" : "Ativar tema escuro"
      }
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </Button>
  );
}

function UserMenu({ user }: { user: Usuario }) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  const name = user.name ?? "";
  const email = user.email ?? "";

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-10 gap-2 rounded-full px-1 sm:pr-3" />
        }
      >
        <Avatar className="h-8 w-8">
          {user.photo_url && <AvatarImage src={user.photo_url} alt={name} />}
          <AvatarFallback className="bg-primary/15 text-xs font-medium text-accent-ink">
            {initials(name, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[12rem] truncate sm:inline">{name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: Usuario;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    // fixed inset-0 + overflow-hidden: a página nunca rola. Só a área de
    // conteúdo rola — header e footer ficam sempre visíveis.
    <div className="fixed inset-0 flex overflow-hidden">
      <AppSidebar role={user.role} />

      {/* min-h-0 min-w-0: sem isso o filho com overflow-y-auto estoura o
          flex container e a rolagem desaparece. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <SidebarBrand role={user.role} onNavigate={() => setDrawerOpen(false)} />
              <div className="py-2">
                <SidebarNav role={user.role} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        {/* Só esta div rola. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
        </div>

        {/* Alvo de portal da paginação. empty:hidden -> desaparece sem ocupar
            espaço quando nenhuma página renderiza paginação. */}
        <footer
          id="dashboard-pagination-footer"
          className="flex shrink-0 items-center justify-center px-4 py-2 empty:hidden"
          aria-label="Paginação da página"
        />
      </div>
    </div>
  );
}
