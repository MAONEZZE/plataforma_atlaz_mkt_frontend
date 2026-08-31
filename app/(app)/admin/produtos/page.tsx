"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { listProdutos, type Produto } from "@/lib/api/produtos";
import { adminProdutos } from "@/lib/api/admin";
import { useRowSelection } from "@/hooks/use-row-selection";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/data/EmptyState";
import { Pagination } from "@/components/data/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ProdutoModal } from "./ProdutoModal";
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

export default function AdminProdutosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Produto | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<Produto | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const allProdutos = data ?? [];
  const filtered = busca.trim()
    ? allProdutos.filter((p) => {
        const q = busca.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      })
    : allProdutos;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds = pageItems.map((p) => p.id);

  const { selected, toggle, toggleAll, clear, allChecked, someChecked } = useRowSelection(pageIds);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, busca]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
  }

  const deleteMut = useMutation({
    mutationFn: () => adminProdutos.remove(deleting!.id),
    onSuccess: () => {
      toast.success("Produto removido.");
      setDeleting(null);
      invalidate();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.data?.error?.code === "PRODUCT_IN_USE") {
        toast.error("Produto está vinculado a clientes e não pode ser removido.");
      } else {
        toast.error("Erro ao remover produto.");
      }
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(ids.map((id) => adminProdutos.remove(id)));
      return { ids, results };
    },
    onSuccess: ({ ids, results }) => {
      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        toast.error(`${failedCount} de ${ids.length} produto(s) não puderam ser removidos.`);
      } else {
        toast.success(`${ids.length} produto(s) removidos.`);
        clear();
      }
      setBulkDeleting(false);
      invalidate();
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os produtos da plataforma.
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
            Novo produto
          </Button>
        </div>
      </div>

      <GlassCard variant="solid" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou descrição..."
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} registros</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : pageItems.length === 0 ? (
          <EmptyState title={busca ? "Nenhum produto encontrado." : "Nenhum produto ainda."} className="py-8" />
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
                <TableHead>Capa</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => setModal({ open: true, editing: p })}
                  className="cursor-pointer hover:bg-accent/40"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                      aria-label={`Selecionar ${p.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    {p.cover_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_photo} alt={p.name} className="size-9 rounded-lg object-cover" />
                    ) : (
                      <div className="size-9 rounded-lg bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium break-all">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[280px] whitespace-normal">
                    <span className="line-clamp-2 break-all">{p.description ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setModal({ open: true, editing: p }); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleting(p); }}
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

        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>

      <ProdutoModal
        open={modal.open}
        onOpenChange={(o) => setModal((p) => ({ ...p, open: o }))}
        editingProduto={modal.editing}
        onSuccess={invalidate}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleting} onOpenChange={(o) => !o && setBulkDeleting(false)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {selected.size} produto(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Produtos vinculados a clientes não poderão ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMut.mutate()} disabled={bulkDeleteMut.isPending}>
              {bulkDeleteMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
