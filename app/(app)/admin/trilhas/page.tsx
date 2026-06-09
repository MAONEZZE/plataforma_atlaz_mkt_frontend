"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { getTrilha, listTrilhas, type Aula, type Modulo, type Trilha, type TrilhaDetalhe } from "@/lib/api/conteudo";
import { adminAulas, adminModulos, adminTrilhas } from "@/lib/api/admin";
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
import { ModuloModal } from "./ModuloModal";
import { AulaModal } from "./AulaModal";

type DeleteTarget =
  | { type: "trilha"; id: string }
  | { type: "modulo"; id: string }
  | { type: "aula"; id: string }
  | null;

const DELETE_MESSAGES = {
  trilha: "Esta ação removerá a trilha e todos os seus módulos e aulas. Mentorados perderão o progresso registrado.",
  modulo: "Esta ação removerá o módulo e todas as suas aulas.",
  aula: "Esta ação removerá a aula. Comentários e progresso serão apagados.",
};

function moveAndReindex<T extends { id: string }>(arr: T[], from: number, to: number) {
  return arrayMove(arr, from, to).map((item, i) => ({ id: item.id, order: i }));
}

const GRIP_CLASS =
  "p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none shrink-0";

interface AulaRowProps {
  aula: Aula;
  moduleId: string;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableAulaRow({ aula, onEdit, onDelete }: AulaRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aula.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent"
    >
      <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
        <GripVertical className="size-3" />
      </button>
      <span className="text-sm flex-1 line-clamp-1">{aula.title}</span>
      {aula.duration_minutes !== null && (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {aula.duration_minutes}min
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

interface ModuloRowProps {
  modulo: Modulo;
  trackId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddAula: () => void;
  onEditAula: (aula: Aula) => void;
  onDeleteAula: (id: string) => void;
  reorderLessonsMut: ReturnType<typeof useReorderLessonsMut>;
}

function SortableModuloRow({
  modulo,
  trackId,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddAula,
  onEditAula,
  onDeleteAula,
  reorderLessonsMut,
}: ModuloRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: modulo.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const sortedLessons = [...modulo.lessons].sort((a, b) => a.order - b.order);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = sortedLessons.findIndex((a) => a.id === active.id);
    const to = sortedLessons.findIndex((a) => a.id === over.id);
    if (from === -1 || to === -1) return;
    reorderLessonsMut.mutate({ sorted: sortedLessons, from, to, trackId });
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
          <GripVertical className="size-3" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" />
          )}
          <span className="text-sm font-medium">{modulo.title}</span>
        </button>
        <span className="text-xs text-muted-foreground mr-2">{modulo.lessons.length} aulas</span>
        <button
          type="button"
          onClick={onEdit}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
      {isExpanded && (
        <div className="border-t border-border px-3 py-2 space-y-2 bg-background/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Aulas</span>
            <Button size="sm" variant="outline" onClick={onAddAula}>
              <Plus className="mr-1 size-3.5" />
              Adicionar aula
            </Button>
          </div>
          {sortedLessons.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">Nenhuma aula ainda.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedLessons.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {sortedLessons.map((aula) => (
                    <SortableAulaRow
                      key={aula.id}
                      aula={aula}
                      moduleId={modulo.id}
                      onEdit={() => onEditAula(aula)}
                      onDelete={() => onDeleteAula(aula.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

interface TrilhaRowProps {
  trilha: Trilha;
  isExpanded: boolean;
  detail: TrilhaDetalhe | undefined;
  expandedModules: Set<string>;
  onToggle: () => void;
  onToggleModule: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddModulo: () => void;
  onEditModulo: (modulo: Modulo) => void;
  onDeleteModulo: (id: string) => void;
  onAddAula: (moduleId: string) => void;
  onEditAula: (moduleId: string, aula: Aula) => void;
  onDeleteAula: (id: string) => void;
  reorderModulesMut: ReturnType<typeof useReorderModulesMut>;
  reorderLessonsMut: ReturnType<typeof useReorderLessonsMut>;
}

function SortableTrilhaRow({
  trilha,
  isExpanded,
  detail,
  expandedModules,
  onToggle,
  onToggleModule,
  onEdit,
  onDelete,
  onAddModulo,
  onEditModulo,
  onDeleteModulo,
  onAddAula,
  onEditAula,
  onDeleteAula,
  reorderModulesMut,
  reorderLessonsMut,
}: TrilhaRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: trilha.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const sortedModules = detail ? [...detail.modules].sort((a, b) => a.order - b.order) : [];

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = sortedModules.findIndex((m) => m.id === active.id);
    const to = sortedModules.findIndex((m) => m.id === over.id);
    if (from === -1 || to === -1) return;
    reorderModulesMut.mutate({ sorted: sortedModules, from, to, trackId: trilha.id });
  }

  return (
    <div ref={setNodeRef} style={style} className="solid-surface">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0" />
          ) : (
            <ChevronRight className="size-4 shrink-0" />
          )}
          <span className="font-medium">{trilha.title}</span>
        </button>
        <span className="text-xs text-muted-foreground mr-2">{trilha.total_lessons} aulas</span>
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {!detail ? (
            <Skeleton className="h-10 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Módulos
                </span>
                <Button size="sm" variant="outline" onClick={onAddModulo}>
                  <Plus className="mr-1 size-3.5" />
                  Adicionar módulo
                </Button>
              </div>
              {sortedModules.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Nenhum módulo ainda.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedModules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {sortedModules.map((modulo) => (
                        <SortableModuloRow
                          key={modulo.id}
                          modulo={modulo}
                          trackId={trilha.id}
                          isExpanded={expandedModules.has(modulo.id)}
                          onToggle={() => onToggleModule(modulo.id)}
                          onEdit={() => onEditModulo(modulo)}
                          onDelete={() => onDeleteModulo(modulo.id)}
                          onAddAula={() => onAddAula(modulo.id)}
                          onEditAula={(aula) => onEditAula(modulo.id, aula)}
                          onDeleteAula={onDeleteAula}
                          reorderLessonsMut={reorderLessonsMut}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function useReorderModulesMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: (vars: { sorted: Modulo[]; from: number; to: number; trackId: string }) =>
      adminModulos.reordenar({ order: moveAndReindex(vars.sorted, vars.from, vars.to) }),
    onMutate: async (vars) => {
      const key = ["trilha", vars.trackId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TrilhaDetalhe>(key);
      const orderMap = new Map(
        moveAndReindex(vars.sorted, vars.from, vars.to).map((o) => [o.id, o.order]),
      );
      qc.setQueryData<TrilhaDetalhe>(key, (old) =>
        old
          ? {
              ...old,
              modules: old.modules.map((m) =>
                orderMap.has(m.id) ? { ...m, order: orderMap.get(m.id)! } : m,
              ),
            }
          : old,
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Erro ao reordenar.");
    },
    onSuccess: () => toast.success("Ordem atualizada."),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.trackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
    },
  });
}

function useReorderLessonsMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: (vars: { sorted: Aula[]; from: number; to: number; trackId: string }) =>
      adminAulas.reordenar({ order: moveAndReindex(vars.sorted, vars.from, vars.to) }),
    onMutate: async (vars) => {
      const key = ["trilha", vars.trackId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TrilhaDetalhe>(key);
      const orderMap = new Map(
        moveAndReindex(vars.sorted, vars.from, vars.to).map((o) => [o.id, o.order]),
      );
      qc.setQueryData<TrilhaDetalhe>(key, (old) =>
        old
          ? {
              ...old,
              modules: old.modules.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) =>
                  orderMap.has(l.id) ? { ...l, order: orderMap.get(l.id)! } : l,
                ),
              })),
            }
          : old,
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Erro ao reordenar.");
    },
    onSuccess: () => toast.success("Ordem atualizada."),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.trackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
    },
  });
}

export default function AdminTrilhasPage() {
  const qc = useQueryClient();
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [trilhaModal, setTrilhaModal] = useState<{ open: boolean; editing: Trilha | null }>({
    open: false,
    editing: null,
  });
  const [moduloModal, setModuloModal] = useState<{
    open: boolean;
    trackId: string;
    editing: Modulo | null;
  }>({ open: false, trackId: "", editing: null });
  const [aulaModal, setAulaModal] = useState<{
    open: boolean;
    moduleId: string;
    editing: Aula | null;
  }>({ open: false, moduleId: "", editing: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["trilhas"],
    queryFn: listTrilhas,
  });

  const expandedTrackIds = Array.from(expandedTracks);
  const trackDetailQueries = useQueries({
    queries: expandedTrackIds.map((id) => ({
      queryKey: ["trilha", id],
      queryFn: () => getTrilha(id),
    })),
  });
  const trackDetails = new Map<string, TrilhaDetalhe>();
  expandedTrackIds.forEach((id, i) => {
    const data = trackDetailQueries[i]?.data;
    if (data) trackDetails.set(id, data);
  });

  const deleteMut = useMutation({
    mutationFn: async (target: NonNullable<DeleteTarget>) => {
      if (target.type === "trilha") await adminTrilhas.remove(target.id);
      else if (target.type === "modulo") await adminModulos.remove(target.id);
      else await adminAulas.remove(target.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      qc.invalidateQueries({ queryKey: ["trilha"] });
      toast.success("Removido com sucesso.");
    },
    onError: () => toast.error("Erro ao remover."),
  });

  const reorderTracksMut = useMutation({
    mutationFn: (vars: { sorted: Trilha[]; from: number; to: number }) =>
      adminTrilhas.reordenar({ order: moveAndReindex(vars.sorted, vars.from, vars.to) }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["trilhas"] });
      const prev = qc.getQueryData<Trilha[]>(["trilhas"]);
      const orderMap = new Map(
        moveAndReindex(vars.sorted, vars.from, vars.to).map((o) => [o.id, o.order]),
      );
      qc.setQueryData<Trilha[]>(["trilhas"], (old) =>
        old?.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["trilhas"], ctx.prev);
      toast.error("Erro ao reordenar.");
    },
    onSuccess: () => toast.success("Ordem atualizada."),
    onSettled: () => qc.invalidateQueries({ queryKey: ["trilhas"] }),
  });

  const reorderModulesMut = useReorderModulesMut(qc);
  const reorderLessonsMut = useReorderLessonsMut(qc);

  function toggleTrack(id: string) {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function refetchTracks() {
    qc.invalidateQueries({ queryKey: ["trilhas"] });
    qc.invalidateQueries({ queryKey: ["trilha"] });
  }

  const sortedTrilhas = trilhas ? [...trilhas].sort((a, b) => a.order - b.order) : [];

  function handleTrackDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = sortedTrilhas.findIndex((t) => t.id === active.id);
    const to = sortedTrilhas.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    reorderTracksMut.mutate({ sorted: sortedTrilhas, from, to });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gerenciar Trilhas</h1>
        <Button
          variant="primary"
          onClick={() => setTrilhaModal({ open: true, editing: null })}
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
          action={{
            label: "Criar primeira trilha",
            onClick: () => setTrilhaModal({ open: true, editing: null }),
          }}
        />
      )}

      {trilhas && trilhas.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTrackDragEnd}
        >
          <SortableContext
            items={sortedTrilhas.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedTrilhas.map((trilha) => (
                <SortableTrilhaRow
                  key={trilha.id}
                  trilha={trilha}
                  isExpanded={expandedTracks.has(trilha.id)}
                  detail={trackDetails.get(trilha.id)}
                  expandedModules={expandedModules}
                  onToggle={() => toggleTrack(trilha.id)}
                  onToggleModule={toggleModule}
                  onEdit={() => setTrilhaModal({ open: true, editing: trilha })}
                  onDelete={() => setDeleteTarget({ type: "trilha", id: trilha.id })}
                  onAddModulo={() =>
                    setModuloModal({ open: true, trackId: trilha.id, editing: null })
                  }
                  onEditModulo={(modulo) =>
                    setModuloModal({ open: true, trackId: trilha.id, editing: modulo })
                  }
                  onDeleteModulo={(id) => setDeleteTarget({ type: "modulo", id })}
                  onAddAula={(moduleId) =>
                    setAulaModal({ open: true, moduleId, editing: null })
                  }
                  onEditAula={(moduleId, aula) =>
                    setAulaModal({ open: true, moduleId, editing: aula })
                  }
                  onDeleteAula={(id) => setDeleteTarget({ type: "aula", id })}
                  reorderModulesMut={reorderModulesMut}
                  reorderLessonsMut={reorderLessonsMut}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TrilhaModal
        open={trilhaModal.open}
        onOpenChange={(o) => setTrilhaModal((p) => ({ ...p, open: o }))}
        editingTrilha={trilhaModal.editing}
        onSuccess={refetchTracks}
      />
      <ModuloModal
        open={moduloModal.open}
        onOpenChange={(o) => setModuloModal((p) => ({ ...p, open: o }))}
        trackId={moduloModal.trackId}
        editingModulo={moduloModal.editing}
        onSuccess={refetchTracks}
      />
      <AulaModal
        open={aulaModal.open}
        onOpenChange={(o) => setAulaModal((p) => ({ ...p, open: o }))}
        moduleId={aulaModal.moduleId}
        editingAula={aulaModal.editing}
        onSuccess={refetchTracks}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {deleteTarget?.type ?? ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? DELETE_MESSAGES[deleteTarget.type] : ""}
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
