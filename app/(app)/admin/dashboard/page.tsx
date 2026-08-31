"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { adminClientes, type ClienteLinha } from "@/lib/api/admin";
import { formatPhone } from "@/lib/utils/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Pagination } from "@/components/data/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientMetricsModal } from "@/components/admin/ClientMetricsModal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const PAGE_SIZE = 20;

type SortField = "name" | "created_at";
interface SortState {
  field: SortField;
  direction: "asc" | "desc";
}

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebouncedValue(busca, 400);
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClienteLinha | null>(null);

  const filterKey = `${buscaDebounced}|${sort?.field ?? ""}|${sort?.direction ?? ""}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  function toggleSort(field: SortField) {
    setSort((prev) => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  }

  function sortIcon(field: SortField) {
    if (sort?.field !== field) return <ArrowUpDown className="size-3 opacity-40" />;
    return sort.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard-clientes", page, buscaDebounced, sort?.field, sort?.direction],
    queryFn: () =>
      adminClientes.list({
        page,
        page_size: PAGE_SIZE,
        busca: buscaDebounced || undefined,
        ordenar: sort?.field,
        direcao: sort?.direction,
      }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral dos clientes cadastrados.
        </p>
      </div>

      <GlassCard variant="solid" className="space-y-4 h-fit">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Clientes</h2>
          <span className="text-xs text-muted-foreground">{total} registros</span>
        </div>

        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="max-w-xs"
        />

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Erro ao carregar clientes.
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={buscaDebounced ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."}
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Nome
                    {sortIcon("name")}
                  </button>
                </TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Cadastro
                    {sortIcon("created_at")}
                  </button>
                </TableHead>
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
                  <TableCell className="text-muted-foreground text-xs">
                    {c.created_at ? format(new Date(c.created_at), "dd/MM/yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>

      <ClientMetricsModal
        clientId={selectedClient?.id ?? null}
        clientName={selectedClient?.name}
        onOpenChange={(o) => !o && setSelectedClient(null)}
      />
    </div>
  );
}
