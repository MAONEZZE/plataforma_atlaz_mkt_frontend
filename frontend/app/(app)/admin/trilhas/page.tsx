"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { listTrilhas, type Trilha } from "@/lib/api/conteudo";
import { adminTrilhas, adminModulos, adminAulas } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
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
import { TrilhaModal } from "./TrilhaModal";
import { cn } from "@/lib/utils";

type DeleteTarget =
  | { type: "trilha"; id: string; nome: string }
  | { type: "modulo"; id: string; nome: string }
  | { type: "aula"; id: string; nome: string }
  | null;

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (attrs: { dragHandleProps: React.HTMLAttributes<HTMLSpanElement> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}

export default function AdminTrilhasPage() {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<Trilha | null>(null);

  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["trilhas"],
    queryFn: listTrilhas,
  });

  const deleteMut = useMutation({
    mutationFn: async (target: NonNullable<DeleteTarget>) => {
      if (target.type === "trilha") await adminTrilhas.remove(target.id);
      else if (target.type === "modulo") await adminModulos.remove(target.id);
      else await adminAulas.remove(target.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      toast.success("Removido com sucesso.");
    },
    onError: () => toast.error("Erro ao remover."),
  });

  const reorderMut = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) =>
      adminTrilhas.reordenar({ ordem: ids.map((id, i) => ({ id, ordem: i + 1 })) }),
    onError: () => {
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      toast.error("Erro ao reordenar.");
    },
  });

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !trilhas) return;
    const ids = trilhas.map((t) => t.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reordered = arrayMove(ids, oldIndex, newIndex);
    qc.setQueryData(["trilhas"], () =>
      reordered.map((id) => trilhas.find((t) => t.id === id)!),
    );
    reorderMut.mutate({ ids: reordered });
  }

  const deleteMessages = {
    trilha: "Esta ação removerá a trilha e todos os seus módulos e aulas. Mentorados perderão o progresso registrado.",
    modulo: "Esta ação removerá o módulo e todas as suas aulas.",
    aula: "Esta ação removerá a aula. Comentários e progresso serão apagados.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gerenciar Trilhas</h1>
        <Button
          variant="primary"
          onClick={() => { setEditingTrilha(null); setModalOpen(true); }}
        >
          <Plus className="mr-1.5 size-4" />
          Nova trilha
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      )}

      {trilhas && trilhas.length === 0 && (
        <EmptyState
          title="Nenhuma trilha criada ainda."
          action={{ label: "Criar primeira trilha", onClick: () => setModalOpen(true) }}
        />
      )}

      {trilhas && trilhas.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={trilhas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {trilhas.map((trilha) => (
                <SortableItem key={trilha.id} id={trilha.id}>
                  {({ dragHandleProps }) => (
                    <div className="solid-surface">
                      {/* Trilha row */}
                      <div className="flex items-center gap-2 px-4 py-3">
                        <span
                          {...dragHandleProps}
                          className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
                        >
                          <GripVertical className="size-4" />
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleExpand(trilha.id)}
                          className="flex items-center gap-1.5 flex-1 text-left"
                        >
                          {expanded.has(trilha.id) ? (
                            <ChevronDown className="size-4 shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0" />
                          )}
                          <span className="font-medium">{trilha.titulo}</span>
                        </button>
                        <span className="text-xs text-muted-foreground mr-2">
                          {trilha.total_aulas} aulas
                        </span>
                        <button
                          type="button"
                          onClick={() => { setEditingTrilha(trilha); setModalOpen(true); }}
                          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: "trilha", id: trilha.id, nome: trilha.titulo })}
                          className="p-1.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TrilhaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingTrilha={editingTrilha}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["trilhas"] })}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {deleteTarget?.type === "trilha" ? "trilha" : deleteTarget?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? deleteMessages[deleteTarget.type] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white"
              onClick={() => {
                if (deleteTarget) deleteMut.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
