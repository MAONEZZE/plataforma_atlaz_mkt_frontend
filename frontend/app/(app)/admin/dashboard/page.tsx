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

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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
      accessorKey: "nome",
      header: "Mentorado",
      cell: ({ row: { original: r } }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            {r.foto_url && <AvatarImage src={r.foto_url} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(r.nome)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{r.nome}</span>
        </div>
      ),
    },
    { accessorKey: "ligacoes_agendadas", header: "Lig. Agendadas" },
    { accessorKey: "ligacoes_realizadas", header: "Lig. Realizadas" },
    { accessorKey: "reunioes_agendadas", header: "Reuniões" },
    { accessorKey: "indicacoes", header: "Indicações" },
    {
      id: "ultima",
      header: "Última métrica",
      cell: ({ row }) =>
        row.original.ultima_metrica_em
          ? format(new Date(row.original.ultima_metrica_em), "dd/MM/yyyy")
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

  const agregados = data?.agregados;

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
            { label: "Ligações Agendadas", value: agregados?.ligacoes_agendadas_total ?? 0, icon: <Phone className="size-5" /> },
            { label: "Ligações Realizadas", value: agregados?.ligacoes_realizadas_total ?? 0, icon: <TrendingUp className="size-5" /> },
            { label: "Reuniões Agendadas", value: agregados?.reunioes_agendadas_total ?? 0, icon: <Users className="size-5" /> },
            { label: "Indicações", value: agregados?.indicacoes_total ?? 0, icon: <UserPlus className="size-5" /> },
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
            Com métrica: <strong>{agregados.mentorados_com_metrica_no_mes}</strong>
          </span>
          {agregados.mentorados_sem_metrica_no_mes > 0 && (
            <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/30">
              {agregados.mentorados_sem_metrica_no_mes} sem métrica
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
