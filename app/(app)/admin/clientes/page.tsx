"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminClientes } from "@/lib/api/admin";
import type { ClienteLinha } from "@/lib/api/admin";
import { formatPhone } from "@/lib/utils/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRowSelection } from "@/hooks/use-row-selection";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Pagination } from "@/components/data/Pagination";
import { ClientManageModal } from "./ClientManageModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 20;

type SortField = "name" | "created_at";
interface SortState {
  field: SortField;
  direction: "asc" | "desc";
}

export default function AdminClientesPage() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebouncedValue(busca, 400);
  const [sort, setSort] = useState<SortState | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: ClienteLinha | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<ClienteLinha | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const filterKey = `${buscaDebounced}|${sort?.field ?? ""}|${sort?.direction ?? ""}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "clientes", page, buscaDebounced, sort?.field, sort?.direction],
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
  const pageIds = items.map((c) => c.id);

  const { selected, toggle, toggleAll, clear, allChecked, someChecked } = useRowSelection(pageIds);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, buscaDebounced]);

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

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
  }

  const deleteMut = useMutation({
    mutationFn: () => adminClientes.remove(deleting!.id),
    onSuccess: () => {
      toast.success("Cliente removido.");
      setDeleting(null);
      invalidate();
    },
    onError: () => toast.error("Erro ao remover cliente."),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(ids.map((id) => adminClientes.remove(id)));
      return { ids, results };
    },
    onSuccess: ({ ids, results }) => {
      const failedIds = ids.filter((_, i) => results[i].status === "rejected");
      if (failedIds.length > 0) {
        toast.error(`${failedIds.length} de ${ids.length} cliente(s) não puderam ser removidos.`);
      } else {
        toast.success(`${ids.length} cliente(s) removidos.`);
        clear();
      }
      setBulkDeleting(false);
      invalidate();
    },
  });

  if (isError) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Erro ao carregar clientes.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as contas de clientes da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => setBulkDeleting(true)}
          >
            <Trash2 className="size-3.5" />
            Excluir{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
          <Button variant="primary" onClick={() => setModal({ open: true, editing: null })}>
            <Plus className="size-3.5" />
            Novo cliente
          </Button>
        </div>
      </div>

      <GlassCard variant="solid" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground shrink-0">{total} registros</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
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
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
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
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Produto</TableHead>
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => setModal({ open: true, editing: c })}
                  className="cursor-pointer hover:bg-accent/40"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={() => toggle(c.id)}
                      aria-label={`Selecionar ${c.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium break-all">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground break-all">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground break-all">{formatPhone(c.phone)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[180px] whitespace-normal">
                    <span className="line-clamp-2">{c.description ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs break-all">{c.product_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.created_at ? format(new Date(c.created_at), "dd/MM/yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/clientes/${c.id}`); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setModal({ open: true, editing: c }); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleting(c); }}
                        className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>

      <ClientManageModal
        open={modal.open}
        onOpenChange={(o) => setModal((p) => ({ ...p, open: o }))}
        client={modal.editing}
        showFullViewLink
        onSuccess={invalidate}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleting} onOpenChange={(o) => !o && setBulkDeleting(false)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {selected.size} cliente(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá os clientes selecionados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMut.mutate()}
              disabled={bulkDeleteMut.isPending}
            >
              {bulkDeleteMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
