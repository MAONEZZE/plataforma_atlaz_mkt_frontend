"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminClientes, type ClienteLinha } from "@/lib/api/admin";
import { formatPhone } from "@/lib/utils/format";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientMetricsModal } from "@/components/admin/ClientMetricsModal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const PAGE_SIZE = 20;

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClienteLinha | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard-clientes", page],
    queryFn: () => adminClientes.list({ page, page_size: PAGE_SIZE }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral dos clientes cadastrados.
        </p>
      </div>

      <GlassCard variant="solid" className="space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Clientes</h2>
          <span className="text-xs text-muted-foreground">{total} registros</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Erro ao carregar clientes.
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className="cursor-pointer hover:bg-accent/40"
                >
                  <TableCell className="font-medium break-all">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground break-all">{formatPhone(c.phone)}</TableCell>
                  <TableCell className="text-muted-foreground break-all">{c.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Anterior
            </button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Próximo
            </button>
          </div>
        )}
      </GlassCard>

      <ClientMetricsModal
        clientId={selectedClient?.id ?? null}
        clientName={selectedClient?.name}
        onOpenChange={(o) => !o && setSelectedClient(null)}
      />
    </div>
  );
}
