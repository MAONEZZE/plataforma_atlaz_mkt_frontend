"use client";

import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/auth/store";
import type { Usuario } from "@/lib/api/types";

interface UserDropdownProps {
  user: Usuario;
  mobile?: boolean;
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserDropdown({ user, mobile = false }: UserDropdownProps) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          <Avatar className="size-8">
            {user.photo_url && <AvatarImage src={user.photo_url} alt={user.name} />}
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!mobile && (
            <span className="text-sm font-medium hidden md:inline-block max-w-[120px] truncate">
              {user.name?.split(" ")[0]}
            </span>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="solid-surface w-48 border border-border shadow-md">
        <DropdownMenuItem onClick={() => router.push("/perfil")} className="cursor-pointer">
          <Settings className="mr-2 size-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-danger focus:text-danger"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
