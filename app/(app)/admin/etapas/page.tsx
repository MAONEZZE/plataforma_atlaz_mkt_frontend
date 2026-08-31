"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { adminStages, adminStageFolders, type Stage, type StageFolder } from "@/lib/api/admin";
import { useRowSelection } from "@/hooks/use-row-selection";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/data/EmptyState";
import { Pagination } from "@/components/data/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StageModal } from "./StageModal";
import { FolderModal } from "./FolderModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function AdminEtapasPage() {
  const queryClient = useQueryClient();

  const { data: folders, isLoading: loadingFolders } = useQuery({
    queryKey: ["admin", "stage-folders"],
    queryFn: adminStageFolders.list,
  });
  const { data: stages, isLoading: loadingStages } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });

  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [stageModal, setStageModal] = useState<{ open: boolean; editing: Stage | null }>({
    open: false,
    editing: null,
  });
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [foldersManagerOpen, setFoldersManagerOpen] = useState(false);
  const [folderModal, setFolderModal] = useState<{ open: boolean; editing: StageFolder | null }>({
    open: false,
    editing: null,
  });
  const [deletingFolder, setDeletingFolder] = useState<StageFolder | null>(null);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["admin", "stage-folders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
  }

  const allStages = stages ?? [];
  const folderTitleById = new Map((folders ?? []).map((f) => [f.id, f.title]));

  const filtered = busca.trim()
    ? allStages.filter((s) => {
        const q = busca.trim().toLowerCase();
        return (s.title ?? "").toLowerCase().includes(q) || s.text.toLowerCase().includes(q);
      })
    : allStages;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds = pageItems.map((s) => s.id);

  const { selected, toggle, toggleAll, clear, allChecked, someChecked } = useRowSelection(pageIds);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, busca]);

  const deleteMut = useMutation({
    mutationFn: () => adminStages.remove(deletingStage!.id),
    onSuccess: () => {
      toast.success("Etapa removida.");
      setDeletingStage(null);
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover etapa."),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(ids.map((id) => adminStages.remove(id)));
      return { ids, results };
    },
    onSuccess: ({ ids, results }) => {
      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        toast.error(`${failedCount} de ${ids.length} etapa(s) não puderam ser removidas.`);
      } else {
        toast.success(`${ids.length} etapa(s) removidas.`);
        clear();
      }
      setBulkDeleting(false);
      invalidateAll();
    },
  });

  const deleteFolderMut = useMutation({
    mutationFn: () => adminStageFolders.remove(deletingFolder!.id),
    onSuccess: () => {
      toast.success("Pasta removida. Etapas ficaram sem pasta.");
      setDeletingFolder(null);
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover pasta."),
  });

  const isLoading = loadingFolders || loadingStages;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Etapas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as etapas da plataforma e organize-as em pastas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFoldersManagerOpen(true)}>
            <Settings2 className="size-3.5" />
            Gerenciar pastas
          </Button>
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => setBulkDeleting(true)}
          >
            <Trash2 className="size-3.5" />
            Excluir{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
          <Button variant="primary" onClick={() => setStageModal({ open: true, editing: null })}>
            <Plus className="size-3.5" />
            Nova etapa
          </Button>
        </div>
      </div>

      <GlassCard variant="solid" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPage(1); }}
            placeholder="Buscar por título ou texto..."
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} registros</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : pageItems.length === 0 ? (
          <EmptyState title={busca ? "Nenhuma etapa encontrada." : "Nenhuma etapa ainda."} className="py-8" />
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
                <TableHead>Nome</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((s) => {
                const label = s.title?.trim() ? s.title : s.text;
                return (
                  <TableRow
                    key={s.id}
                    onClick={() => setStageModal({ open: true, editing: s })}
                    className="cursor-pointer hover:bg-accent/40"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                        aria-label={`Selecionar ${label}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[360px]">
                      <span className="line-clamp-2 break-all whitespace-normal">{label}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.folder_id ? folderTitleById.get(s.folder_id) ?? "—" : "Sem pasta"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setStageModal({ open: true, editing: s }); }}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeletingStage(s); }}
                          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>

      <StageModal
        open={stageModal.open}
        onOpenChange={(o) => setStageModal((p) => ({ ...p, open: o }))}
        editingStage={stageModal.editing}
        nextOrder={allStages.length}
        onSuccess={invalidateAll}
      />

      <AlertDialog open={!!deletingStage} onOpenChange={(o) => !o && setDeletingStage(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta etapa será removida permanentemente de todos os clientes.
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
            <AlertDialogTitle>Remover {selected.size} etapa(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá as etapas selecionadas de todos os clientes permanentemente.
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

      {/* Gerenciar pastas */}
      <Dialog open={foldersManagerOpen} onOpenChange={setFoldersManagerOpen}>
        <DialogContent className="max-w-sm glass" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Gerenciar pastas</DialogTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFolderModal({ open: true, editing: null })}
              >
                <Plus className="size-3.5" />
                Nova
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {(folders ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma pasta ainda.</p>
            ) : (
              folders?.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm font-medium truncate">{f.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFolderModal({ open: true, editing: f })}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingFolder(f)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setFoldersManagerOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FolderModal
        open={folderModal.open}
        onOpenChange={(o) => setFolderModal((p) => ({ ...p, open: o }))}
        editingFolder={folderModal.editing}
        nextOrder={folders?.length ?? 0}
        onSuccess={invalidateAll}
      />

      <AlertDialog open={!!deletingFolder} onOpenChange={(o) => !o && setDeletingFolder(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pasta &quot;{deletingFolder?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              As etapas dentro dela não serão apagadas — ficarão sem pasta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFolderMut.mutate()} disabled={deleteFolderMut.isPending}>
              {deleteFolderMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
