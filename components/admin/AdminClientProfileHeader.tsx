"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import { initials, SocialLinks } from "@/components/community/MentoradoCard";
import { formatPhone } from "@/lib/utils/format";
import type { AdminClientDetailResponse } from "@/lib/api/admin";

interface AdminClientProfileHeaderProps {
  client: AdminClientDetailResponse;
  onEdit: () => void;
}

export function AdminClientProfileHeader({ client, onEdit }: AdminClientProfileHeaderProps) {
  const { name, photo_url, linkedin_url, instagram_username, description, role, product_name, email, phone, created_at } = client;

  return (
    <GlassCard variant="solid" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Avatar className="size-20 shrink-0">
          {photo_url && <AvatarImage src={photo_url} alt={name} />}
          <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{name}</h1>
            {role === "admin" && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Equipe Atlaz
              </span>
            )}
            {product_name && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {product_name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {formatPhone(phone)}
            </span>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{description}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Cliente desde {format(new Date(created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0">
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>

      <SocialLinks linkedin_url={linkedin_url} instagram_username={instagram_username} name={name} />
    </GlassCard>
  );
}
