"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/glass/GlassCard";
import { DataTable } from "@/components/data/DataTable";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboard, type AdminDashboardLinha } from "@/lib/api/admin";
import { Phone, Users, UserPlus, TrendingUp } from "lucide-react";

const PAGE_SIZE = 20;

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");

  const mes = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard", { page, busca }],
    queryFn: () =>
      getAdminDashboard({ page, page_size: PAGE_SIZE, busca: busca || undefined }),
  });

  const columns: ColumnDef<AdminDashboardLinha>[] = [
    {
      accessorKey: "name",
      header: "Mentorado",
      cell: ({ row: { original: r } }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            {r.photo_url && <AvatarImage src={r.photo_url} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(r.name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{r.name}</span>
        </div>
      ),
    },
    { accessorKey: "calls_scheduled", header: "Reun. Realizadas" },
    { accessorKey: "calls_made", header: "Lig. Realizadas" },
    { accessorKey: "meetings_scheduled", header: "Vendas" },
    { accessorKey: "referrals", header: "Indicações" },
    {
      id: "produto",
      header: "Produto",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.product_name ?? "—"}</span>
      ),
    },
    {
      id: "ultima",
      header: "Última métrica",
      cell: ({ row }) =>
        row.original.last_metric_at
          ? format(new Date(row.original.last_metric_at), "dd/MM/yyyy")
          : "—",
    },
  ];

  if (isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex justify-between items-center">
        Erro ao carregar dados.
        <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  const agregados = data?.aggregates;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground capitalize">Métricas consolidadas — {mes}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Reuniões Realizadas", value: agregados?.calls_scheduled_total ?? 0, icon: <Phone className="size-5" /> },
            { label: "Ligações Realizadas", value: agregados?.calls_made_total ?? 0, icon: <TrendingUp className="size-5" /> },
            { label: "Vendas", value: agregados?.meetings_scheduled_total ?? 0, icon: <Users className="size-5" /> },
            { label: "Indicações", value: agregados?.referrals_total ?? 0, icon: <UserPlus className="size-5" /> },
          ].map((c) => (
            <GlassCard key={c.label} variant="soft" className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <span className="text-primary opacity-70">{c.icon}</span>
              </div>
              <p className="text-2xl font-bold">{c.value.toLocaleString("pt-BR")}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {agregados && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Com métrica: <strong>{agregados.users_with_metric_in_month}</strong>
          </span>
          {agregados.users_without_metric_in_month > 0 && (
            <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/30">
              {agregados.users_without_metric_in_month} sem métrica
            </Badge>
          )}
        </div>
      )}

      <GlassCard variant="solid" className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Buscar mentorado..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPage(1); }}
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-input/30 px-3 py-1 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          emptyState={<EmptyState title="Nenhuma métrica cadastrada neste mês." />}
          pagination={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onChange: setPage }}
        />
      </GlassCard>
    </div>
  );
}
