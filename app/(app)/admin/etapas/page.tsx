"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react";
import {
  DndContext,
  closestCorners,
  useDroppable,
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
import { cn } from "@/lib/utils";
import { adminStages, adminStageFolders, type Stage, type StageFolder } from "@/lib/api/admin";
import { groupStagesByFolder } from "@/lib/utils/stages";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderModal } from "./FolderModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const stageSchema = z.object({
  text: z.string().min(1, "Texto obrigatório"),
  title: z.string().optional(),
  folder_id: z.string().optional(),
});
type StageFormInput = z.infer<typeof stageSchema>;

const GRIP_CLASS =
  "p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none shrink-0";

const UNFILED = "unfiled";

function moveAndReindex<T extends { id: string }>(arr: T[], from: number, to: number) {
  return arrayMove(arr, from, to).map((item, i) => ({ id: item.id, order: i }));
}

function useReorderFoldersMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: (vars: { sorted: StageFolder[]; from: number; to: number }) => {
      const changes = moveAndReindex(vars.sorted, vars.from, vars.to);
      return Promise.all(changes.map(({ id, order }) => adminStageFolders.update(id, { order })));
    },
    onMutate: async (vars) => {
      const key = ["admin", "stage-folders"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<StageFolder[]>(key);
      const orderMap = new Map(moveAndReindex(vars.sorted, vars.from, vars.to).map((o) => [o.id, o.order]));
      qc.setQueryData<StageFolder[]>(key, (old) =>
        old?.map((f) => (orderMap.has(f.id) ? { ...f, order: orderMap.get(f.id)! } : f)),
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Erro ao reordenar pastas.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "stage-folders"] }),
  });
}

function useReorderStagesMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: (vars: { sorted: Stage[]; from: number; to: number }) => {
      const changes = moveAndReindex(vars.sorted, vars.from, vars.to);
      const byId = new Map(vars.sorted.map((s) => [s.id, s]));
      return Promise.all(
        changes.map(({ id, order }) => {
          const s = byId.get(id)!;
          return adminStages.update(id, { text: s.text, title: s.title, folder_id: s.folder_id, order });
        }),
      );
    },
    onMutate: async (vars) => {
      const key = ["admin", "stages"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Stage[]>(key);
      const orderMap = new Map(moveAndReindex(vars.sorted, vars.from, vars.to).map((o) => [o.id, o.order]));
      qc.setQueryData<Stage[]>(key, (old) =>
        old?.map((s) => (orderMap.has(s.id) ? { ...s, order: orderMap.get(s.id)! } : s)),
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Erro ao reordenar etapas.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "stages"] }),
  });
}

function useMoveStageMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: (vars: { stage: Stage; folder_id: string | null; order: number }) =>
      adminStages.update(vars.stage.id, {
        text: vars.stage.text,
        title: vars.stage.title,
        folder_id: vars.folder_id,
        order: vars.order,
      }),
    onMutate: async (vars) => {
      const key = ["admin", "stages"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Stage[]>(key);
      qc.setQueryData<Stage[]>(key, (old) =>
        old?.map((s) => (s.id === vars.stage.id ? { ...s, folder_id: vars.folder_id, order: vars.order } : s)),
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Erro ao mover etapa.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "stages"] }),
  });
}

interface StageRowProps {
  stage: Stage;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableStageRow({ stage, isOpen, onToggle, onEdit, onDelete }: StageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const label = stage.title?.trim() ? stage.title : stage.text;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
          <GripVertical className="size-3" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
        >
          <ChevronDown
            className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
          <span className="text-sm font-medium truncate min-w-0">{label}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="px-3 pb-3 pt-0 border-t border-border/40">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all pt-2">{stage.text}</p>
        </div>
      )}
    </div>
  );
}

interface StageListProps {
  stages: Stage[];
  emptyLabel: string;
  expandedStages: Set<string>;
  onToggleStage: (id: string) => void;
  onEditStage: (s: Stage) => void;
  onDeleteStage: (s: Stage) => void;
}

function StageList({ stages, emptyLabel, expandedStages, onToggleStage, onEditStage, onDeleteStage }: StageListProps) {
  if (stages.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-2 pl-2">{emptyLabel}</p>;
  }

  return (
    <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-1.5">
        {stages.map((s) => (
          <SortableStageRow
            key={s.id}
            stage={s}
            isOpen={expandedStages.has(s.id)}
            onToggle={() => onToggleStage(s.id)}
            onEdit={() => onEditStage(s)}
            onDelete={() => onDeleteStage(s)}
          />
        ))}
      </div>
    </SortableContext>
  );
}

interface FolderSectionProps extends Omit<StageListProps, "emptyLabel"> {
  folder: StageFolder;
  isExpanded: boolean;
  onToggle: () => void;
  onEditFolder: () => void;
  onDeleteFolder: () => void;
}

function SortableFolderSection({
  folder,
  stages,
  isExpanded,
  onToggle,
  onEditFolder,
  onDeleteFolder,
  ...listProps
}: FolderSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${folder.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      className={cn("solid-surface p-3 transition-colors", isOver && "ring-1 ring-primary/30")}
    >
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-medium truncate">{folder.title}</span>
        </button>
        <span className="text-xs text-muted-foreground mr-1">{stages.length} etapas</span>
        <button
          type="button"
          onClick={onEditFolder}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDeleteFolder}
          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {isExpanded && (
        <div className="pt-2.5">
          <StageList stages={stages} emptyLabel="Nenhuma etapa nesta pasta ainda." {...listProps} />
        </div>
      )}
    </div>
  );
}

function UnfiledSection({ stages, ...listProps }: Omit<StageListProps, "emptyLabel">) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${UNFILED}` });

  return (
    <div className="solid-surface space-y-2.5 p-3">
      <div className="flex items-center gap-2">
        <span className="font-medium flex-1 text-muted-foreground">Sem pasta</span>
        <span className="text-xs text-muted-foreground">{stages.length} etapas</span>
      </div>
      <div
        ref={setDropRef}
        className={cn("rounded-lg transition-colors", isOver && "bg-primary/5 ring-1 ring-primary/30")}
      >
        <StageList stages={stages} emptyLabel="Nenhuma etapa sem pasta." {...listProps} />
      </div>
    </div>
  );
}

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

  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderModal, setFolderModal] = useState<{ open: boolean; editing: StageFolder | null }>({
    open: false,
    editing: null,
  });
  const [deletingFolder, setDeletingFolder] = useState<StageFolder | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const reorderFoldersMut = useReorderFoldersMut(queryClient);
  const reorderStagesMut = useReorderStagesMut(queryClient);
  const moveStageMut = useMoveStageMut(queryClient);

  function toggleFolderExpand(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStageExpand(id: string) {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["admin", "stage-folders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
  }

  const createForm = useForm<StageFormInput>({
    resolver: zodResolver(stageSchema),
    defaultValues: { text: "", title: "", folder_id: "" },
  });
  const editForm = useForm<StageFormInput>({
    resolver: zodResolver(stageSchema),
  });

  function openEdit(s: Stage) {
    editForm.reset({ text: s.text, title: s.title ?? "", folder_id: s.folder_id ?? "" });
    setEditingStage(s);
  }

  const allStages = stages ?? [];

  function siblingCount(folderId: string | null) {
    return allStages.filter((s) => s.folder_id === folderId).length;
  }

  const createMut = useMutation({
    mutationFn: (d: StageFormInput) => {
      const folder_id = d.folder_id || null;
      return adminStages.create({
        text: d.text,
        title: d.title?.trim() ? d.title.trim() : null,
        folder_id,
        order: siblingCount(folder_id),
      });
    },
    onSuccess: () => {
      toast.success("Etapa criada!");
      createForm.reset({ text: "", title: "", folder_id: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao criar etapa."),
  });

  const editMut = useMutation({
    mutationFn: (d: StageFormInput) => {
      if (!editingStage) throw new Error("no stage selected");
      const folder_id = d.folder_id || null;
      const order = folder_id === editingStage.folder_id ? editingStage.order : siblingCount(folder_id);
      return adminStages.update(editingStage.id, {
        text: d.text,
        title: d.title?.trim() ? d.title.trim() : null,
        folder_id,
        order,
      });
    },
    onSuccess: () => {
      toast.success("Etapa atualizada!");
      setEditingStage(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao atualizar etapa."),
  });

  const deleteMut = useMutation({
    mutationFn: () => {
      if (!deletingStage) throw new Error("no stage selected");
      return adminStages.remove(deletingStage.id);
    },
    onSuccess: () => {
      toast.success("Etapa removida.");
      setDeletingStage(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao remover etapa."),
  });

  const deleteFolderMut = useMutation({
    mutationFn: () => {
      if (!deletingFolder) throw new Error("no folder selected");
      return adminStageFolders.remove(deletingFolder.id);
    },
    onSuccess: () => {
      toast.success("Pasta removida. Etapas ficaram sem pasta.");
      setDeletingFolder(null);
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover pasta."),
  });

  const groups = groupStagesByFolder(allStages, folders ?? []);
  const unfiledGroup = groups.find((g) => g.folder === null);
  const folderGroups = groups.filter((g) => g.folder !== null) as { folder: StageFolder; stages: Stage[] }[];
  const sortedFolders = folderGroups.map((g) => g.folder);

  function containerStages(containerId: string): Stage[] {
    if (containerId === UNFILED) return unfiledGroup?.stages ?? [];
    return folderGroups.find((g) => g.folder.id === containerId)?.stages ?? [];
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const isFolderDrag = sortedFolders.some((f) => f.id === activeId);
    if (isFolderDrag) {
      if (!sortedFolders.some((f) => f.id === overId)) return;
      const from = sortedFolders.findIndex((f) => f.id === activeId);
      const to = sortedFolders.findIndex((f) => f.id === overId);
      if (from === -1 || to === -1) return;
      reorderFoldersMut.mutate({ sorted: sortedFolders, from, to });
      return;
    }

    const sourceStage = allStages.find((s) => s.id === activeId);
    if (!sourceStage) return;
    const sourceContainer = sourceStage.folder_id ?? UNFILED;

    let destContainer: string;
    if (overId.startsWith("drop-")) {
      destContainer = overId.slice("drop-".length);
    } else {
      const overStage = allStages.find((s) => s.id === overId);
      if (overStage) {
        destContainer = overStage.folder_id ?? UNFILED;
      } else if (sortedFolders.some((f) => f.id === overId)) {
        destContainer = overId;
      } else {
        return;
      }
    }

    if (sourceContainer === destContainer) {
      const destStages = containerStages(destContainer);
      const from = destStages.findIndex((s) => s.id === activeId);
      const to = destStages.findIndex((s) => s.id === overId);
      if (from === -1 || to === -1 || from === to) return;
      reorderStagesMut.mutate({ sorted: destStages, from, to });
      return;
    }

    const destStages = containerStages(destContainer);
    moveStageMut.mutate({
      stage: sourceStage,
      folder_id: destContainer === UNFILED ? null : destContainer,
      order: destStages.length,
    });
  }

  const isLoading = loadingFolders || loadingStages;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Etapas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie as etapas da plataforma e organize-as em pastas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* Left — create forms */}
        <div className="space-y-4">
          <GlassCard variant="solid" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Pastas</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFolderModal({ open: true, editing: null })}
              >
                <Plus className="size-3.5" />
                Nova pasta
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pastas agrupam etapas. Etapas sem pasta continuam soltas normalmente.
            </p>
          </GlassCard>

          <GlassCard variant="solid" className="space-y-4">
            <h2 className="font-medium">Nova etapa</h2>
            <form
              onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label>Título (opcional)</Label>
                <Input {...createForm.register("title")} placeholder="Título da etapa" />
              </div>
              <div className="space-y-1.5">
                <Label>Texto</Label>
                <textarea
                  {...createForm.register("text")}
                  placeholder="Descreva a etapa..."
                  rows={5}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
                {createForm.formState.errors.text && (
                  <p className="text-xs text-danger">{createForm.formState.errors.text.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Pasta (opcional)</Label>
                <select
                  {...createForm.register("folder_id")}
                  className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">Sem pasta</option>
                  {folders?.map((f) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={createMut.isPending}>
                {createMut.isPending ? "Criando..." : "Criar etapa"}
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Right — folders + stages */}
        <GlassCard variant="solid" className="space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Etapas cadastradas</h2>
            <span className="text-xs text-muted-foreground">{allStages.length} registros</span>
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="space-y-3">
                {sortedFolders.length > 0 && (
                  <SortableContext items={sortedFolders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {folderGroups.map(({ folder, stages: folderStages }) => (
                        <SortableFolderSection
                          key={folder.id}
                          folder={folder}
                          stages={folderStages}
                          isExpanded={expandedFolders.has(folder.id)}
                          onToggle={() => toggleFolderExpand(folder.id)}
                          expandedStages={expandedStages}
                          onToggleStage={toggleStageExpand}
                          onEditStage={openEdit}
                          onDeleteStage={setDeletingStage}
                          onEditFolder={() => setFolderModal({ open: true, editing: folder })}
                          onDeleteFolder={() => setDeletingFolder(folder)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}

                <UnfiledSection
                  stages={unfiledGroup?.stages ?? []}
                  expandedStages={expandedStages}
                  onToggleStage={toggleStageExpand}
                  onEditStage={openEdit}
                  onDeleteStage={setDeletingStage}
                />
              </div>
            </DndContext>
          )}
        </GlassCard>
      </div>

      {/* Edit stage dialog */}
      <Dialog open={!!editingStage} onOpenChange={(o) => !o && setEditingStage(null)}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Editar etapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Título (opcional)</Label>
              <Input {...editForm.register("title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Texto</Label>
              <textarea
                {...editForm.register("text")}
                rows={5}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
              {editForm.formState.errors.text && (
                <p className="text-xs text-danger">{editForm.formState.errors.text.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Pasta (opcional)</Label>
              <select
                {...editForm.register("folder_id")}
                className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Sem pasta</option>
                {folders?.map((f) => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditingStage(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Cancelar
              </button>
              <Button type="submit" variant="primary" disabled={editMut.isPending}>
                {editMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete stage confirm */}
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

      {/* Folder create/edit modal */}
      <FolderModal
        open={folderModal.open}
        onOpenChange={(o) => setFolderModal((p) => ({ ...p, open: o }))}
        editingFolder={folderModal.editing}
        nextOrder={folders?.length ?? 0}
        onSuccess={invalidateAll}
      />

      {/* Delete folder confirm */}
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
