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
  DragOverlay,
  MeasuringStrategy,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
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
import { cn } from "@/lib/utils";
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

// ── Drag and drop ─────────────────────────────────────────────────────────────
// Tudo roda num único DndContext para que um item possa sair do seu container e
// cair em outro (aula -> outro módulo, módulo -> outra trilha). Cada droppable
// declara seu `kind` em `data`; a collision detection filtra os candidatos pelo
// tipo do que está sendo arrastado, então uma aula nunca colide com uma trilha.

type DragKind = "trilha" | "modulo" | "aula";

type DropData =
  | { kind: "trilha" }
  | { kind: "track-header"; trackId: string }
  | { kind: "modules-zone"; trackId: string }
  | { kind: "modulo"; trackId: string }
  | { kind: "module-header"; moduleId: string; trackId: string }
  | { kind: "lessons-zone"; moduleId: string; trackId: string }
  | { kind: "aula"; moduleId: string; trackId: string };

/** Que droppables entram em jogo para cada tipo de item arrastado. */
const CANDIDATE_KINDS: Record<DragKind, DropData["kind"][]> = {
  trilha: ["trilha"],
  modulo: ["modulo", "modules-zone", "track-header"],
  aula: ["aula", "lessons-zone", "module-header"],
};

function dropDataOf(container: { data: { current?: unknown } }): DropData | undefined {
  return container.data.current as DropData | undefined;
}

const collisionDetection: CollisionDetection = (args) => {
  const kind = (args.active.data.current as DropData | undefined)?.kind;
  if (kind !== "trilha" && kind !== "modulo" && kind !== "aula") return [];
  const allowed = CANDIDATE_KINDS[kind];
  const droppableContainers = args.droppableContainers.filter((c) => {
    const data = dropDataOf(c);
    return !!data && allowed.includes(data.kind);
  });

  const pointerHits = pointerWithin({ ...args, droppableContainers });
  if (pointerHits.length > 0) {
    // Zonas envolvem os itens: com o ponteiro sobre um item, ele ganha da zona,
    // para posicionar com precisão em vez de sempre jogar no fim da lista.
    const overItem = pointerHits.find((hit) => {
      const c = droppableContainers.find((d) => d.id === hit.id);
      return c && dropDataOf(c)?.kind === kind;
    });
    return [overItem ?? pointerHits[0]];
  }
  return closestCenter({ ...args, droppableContainers });
};

function moveAndReindex<T extends { id: string }>(arr: T[], from: number, to: number) {
  return arrayMove(arr, from, to).map((item, i) => ({ id: item.id, order: i }));
}

function reindex(ids: string[]) {
  return ids.map((id, i) => ({ id, order: i }));
}

/** Insere `id` na lista do destino, na posição de `beforeId`. */
function insertAt(ids: string[], id: string, beforeId: string): string[] {
  const next = ids.filter((x) => x !== id);
  const at = next.indexOf(beforeId);
  next.splice(at === -1 ? next.length : at, 0, id);
  return next;
}

const GRIP_CLASS =
  "p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none shrink-0";

const DROP_ZONE_ACTIVE = "ring-2 ring-primary/60 ring-offset-1 ring-offset-background rounded-lg";

interface AulaRowProps {
  aula: Aula;
  moduleId: string;
  trackId: string;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableAulaRow({ aula, moduleId, trackId, onEdit, onDelete }: AulaRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aula.id,
    data: { kind: "aula", moduleId, trackId } satisfies DropData,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded px-2 py-1.5 bg-background/60 border border-border/60"
    >
      <button type="button" {...attributes} {...listeners} className={GRIP_CLASS}>
        <GripVertical className="size-3" />
      </button>
      <span className="text-sm flex-1 min-w-0 truncate">{aula.title}</span>
      {aula.duration_minutes != null && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="size-3" />
          {aula.duration_minutes} min
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
}: ModuloRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: modulo.id,
    data: { kind: "modulo", trackId } satisfies DropData,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Cabeçalho recebe aulas mesmo com o módulo recolhido (e expande no hover).
  const { setNodeRef: setHeaderRef, isOver: isHeaderOver } = useDroppable({
    id: `module-header:${modulo.id}`,
    data: { kind: "module-header", moduleId: modulo.id, trackId } satisfies DropData,
  });
  const { setNodeRef: setLessonsZoneRef, isOver: isLessonsZoneOver } = useDroppable({
    id: `lessons-zone:${modulo.id}`,
    data: { kind: "lessons-zone", moduleId: modulo.id, trackId } satisfies DropData,
  });

  const sortedLessons = [...modulo.lessons].sort((a, b) => a.order - b.order);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border">
      <div
        ref={setHeaderRef}
        className={cn("flex items-center gap-2 px-3 py-2", isHeaderOver && DROP_ZONE_ACTIVE)}
      >
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
          <div
            ref={setLessonsZoneRef}
            className={cn("space-y-1 min-h-9", isLessonsZoneOver && DROP_ZONE_ACTIVE)}
          >
            {sortedLessons.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                Nenhuma aula ainda — arraste uma aula para cá.
              </p>
            ) : (
              <SortableContext
                items={sortedLessons.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedLessons.map((aula) => (
                  <SortableAulaRow
                    key={aula.id}
                    aula={aula}
                    moduleId={modulo.id}
                    trackId={trackId}
                    onEdit={() => onEditAula(aula)}
                    onDelete={() => onDeleteAula(aula.id)}
                  />
                ))}
              </SortableContext>
            )}
          </div>
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
}: TrilhaRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: trilha.id,
    data: { kind: "trilha" } satisfies DropData,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Cabeçalho recebe módulos mesmo com a trilha recolhida (e expande no hover).
  const { setNodeRef: setHeaderRef, isOver: isHeaderOver } = useDroppable({
    id: `track-header:${trilha.id}`,
    data: { kind: "track-header", trackId: trilha.id } satisfies DropData,
  });
  const { setNodeRef: setModulesZoneRef, isOver: isModulesZoneOver } = useDroppable({
    id: `modules-zone:${trilha.id}`,
    data: { kind: "modules-zone", trackId: trilha.id } satisfies DropData,
  });

  const sortedModules = detail ? [...detail.modules].sort((a, b) => a.order - b.order) : [];

  return (
    <div ref={setNodeRef} style={style} className="solid-surface">
      <div
        ref={setHeaderRef}
        className={cn("flex items-center gap-2 px-4 py-3", isHeaderOver && DROP_ZONE_ACTIVE)}
      >
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
              <div
                ref={setModulesZoneRef}
                className={cn("space-y-1.5 min-h-9", isModulesZoneOver && DROP_ZONE_ACTIVE)}
              >
                {sortedModules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Nenhum módulo ainda — arraste um módulo para cá.
                  </p>
                ) : (
                  <SortableContext
                    items={sortedModules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
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
                      />
                    ))}
                  </SortableContext>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mutations de ordenação ────────────────────────────────────────────────────

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

// ── Mutations de movimentação entre containers ────────────────────────────────
// `destIds` nulo significa "solta no fim": o backend anexa ao destino sozinho, o
// que também cobre o caso do destino ainda não estar carregado em cache.

interface MoveLessonVars {
  aula: Aula;
  fromModuleId: string;
  fromTrackId: string;
  toModuleId: string;
  toTrackId: string;
  destIds: string[] | null;
  srcIds: string[];
}

function useMoveLessonMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: async (vars: MoveLessonVars) => {
      await adminAulas.update(vars.aula.id, { module_id: vars.toModuleId });
      await adminAulas.reordenar({
        order: [...reindex(vars.destIds ?? []), ...reindex(vars.srcIds)],
      });
    },
    onMutate: async (vars) => {
      const keys = [
        ["trilha", vars.fromTrackId],
        ...(vars.toTrackId === vars.fromTrackId ? [] : [["trilha", vars.toTrackId]]),
      ];
      const snapshots: { key: string[]; prev: TrilhaDetalhe | undefined }[] = [];
      for (const key of keys) {
        await qc.cancelQueries({ queryKey: key });
        snapshots.push({ key, prev: qc.getQueryData<TrilhaDetalhe>(key) });
        qc.setQueryData<TrilhaDetalhe>(key, (old) =>
          old ? applyLessonMove(old, vars) : old,
        );
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(({ key, prev }) => {
        if (prev) qc.setQueryData(key, prev);
      });
      toast.error("Erro ao mover a aula.");
    },
    onSuccess: () => toast.success("Aula movida."),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.fromTrackId] });
      qc.invalidateQueries({ queryKey: ["trilha", vars.toTrackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
    },
  });
}

function applyLessonMove(detail: TrilhaDetalhe, vars: MoveLessonVars): TrilhaDetalhe {
  return {
    ...detail,
    modules: detail.modules.map((m) => {
      if (m.id === vars.fromModuleId) {
        const byId = new Map(m.lessons.map((l) => [l.id, l]));
        return {
          ...m,
          lessons: vars.srcIds.flatMap((id, i) => {
            const l = byId.get(id);
            return l ? [{ ...l, order: i }] : [];
          }),
        };
      }
      if (m.id === vars.toModuleId) {
        const byId = new Map([...m.lessons, vars.aula].map((l) => [l.id, l]));
        const ids =
          vars.destIds ??
          [...m.lessons.filter((l) => l.id !== vars.aula.id).map((l) => l.id), vars.aula.id];
        return {
          ...m,
          lessons: ids.flatMap((id, i) => {
            const l = byId.get(id);
            return l ? [{ ...l, order: i }] : [];
          }),
        };
      }
      return m;
    }),
  };
}

interface MoveModuleVars {
  modulo: Modulo;
  fromTrackId: string;
  toTrackId: string;
  destIds: string[] | null;
  srcIds: string[];
}

function useMoveModuleMut(qc: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: async (vars: MoveModuleVars) => {
      await adminModulos.update(vars.modulo.id, { track_id: vars.toTrackId });
      await adminModulos.reordenar({
        order: [...reindex(vars.destIds ?? []), ...reindex(vars.srcIds)],
      });
    },
    onMutate: async (vars) => {
      const fromKey = ["trilha", vars.fromTrackId];
      const toKey = ["trilha", vars.toTrackId];
      await qc.cancelQueries({ queryKey: fromKey });
      await qc.cancelQueries({ queryKey: toKey });
      const prevFrom = qc.getQueryData<TrilhaDetalhe>(fromKey);
      const prevTo = qc.getQueryData<TrilhaDetalhe>(toKey);

      qc.setQueryData<TrilhaDetalhe>(fromKey, (old) =>
        old
          ? {
              ...old,
              modules: old.modules
                .filter((m) => m.id !== vars.modulo.id)
                .map((m) => ({ ...m, order: vars.srcIds.indexOf(m.id) })),
            }
          : old,
      );
      qc.setQueryData<TrilhaDetalhe>(toKey, (old) => {
        if (!old) return old;
        const pool = [...old.modules.filter((m) => m.id !== vars.modulo.id), vars.modulo];
        const byId = new Map(pool.map((m) => [m.id, m]));
        const ids =
          vars.destIds ??
          [...old.modules.filter((m) => m.id !== vars.modulo.id).map((m) => m.id), vars.modulo.id];
        return {
          ...old,
          modules: ids.flatMap((id, i) => {
            const m = byId.get(id);
            return m ? [{ ...m, order: i }] : [];
          }),
        };
      });
      return { fromKey, toKey, prevFrom, prevTo };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevFrom) qc.setQueryData(ctx.fromKey, ctx.prevFrom);
      if (ctx?.prevTo) qc.setQueryData(ctx.toKey, ctx.prevTo);
      toast.error("Erro ao mover o módulo.");
    },
    onSuccess: () => toast.success("Módulo movido."),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.fromTrackId] });
      qc.invalidateQueries({ queryKey: ["trilha", vars.toTrackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
    },
  });
}

export default function AdminTrilhasPage() {
  const qc = useQueryClient();
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  // Título do item em arraste, só para o DragOverlay que segue o cursor.
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

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
    trackId: string;
    editing: Aula | null;
  }>({ open: false, moduleId: "", trackId: "", editing: null });

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

  function modulesOf(trackId: string): Modulo[] {
    const detail = trackDetails.get(trackId);
    return detail ? [...detail.modules].sort((a, b) => a.order - b.order) : [];
  }

  function lessonsOf(trackId: string, moduleId: string): Aula[] {
    const modulo = trackDetails.get(trackId)?.modules.find((m) => m.id === moduleId);
    return modulo ? [...modulo.lessons].sort((a, b) => a.order - b.order) : [];
  }

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
  const moveLessonMut = useMoveLessonMut(qc);
  const moveModuleMut = useMoveModuleMut(qc);

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

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DropData | undefined;
    if (!data || (data.kind !== "trilha" && data.kind !== "modulo" && data.kind !== "aula")) {
      return;
    }
    const id = String(e.active.id);
    const title =
      data.kind === "trilha"
        ? (sortedTrilhas.find((t) => t.id === id)?.title ?? "")
        : data.kind === "modulo"
          ? (modulesOf(data.trackId).find((m) => m.id === id)?.title ?? "")
          : (lessonsOf(data.trackId, data.moduleId).find((a) => a.id === id)?.title ?? "");
    setActiveTitle(title);
  }

  /** Passar sobre um cabeçalho recolhido abre o container para poder soltar dentro. */
  function handleDragOver(e: DragOverEvent) {
    const over = e.over?.data.current as DropData | undefined;
    if (!over) return;
    if (over.kind === "track-header" && !expandedTracks.has(over.trackId)) {
      toggleTrack(over.trackId);
    }
    if (over.kind === "module-header" && !expandedModules.has(over.moduleId)) {
      toggleModule(over.moduleId);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTitle(null);
    const { active, over } = e;
    if (!over) return;
    const from = active.data.current as DropData | undefined;
    const to = over.data.current as DropData | undefined;
    if (!from || !to) return;
    const activeId = String(active.id);

    if (from.kind === "trilha") {
      if (active.id === over.id) return;
      const fromIdx = sortedTrilhas.findIndex((t) => t.id === activeId);
      const toIdx = sortedTrilhas.findIndex((t) => t.id === String(over.id));
      if (fromIdx === -1 || toIdx === -1) return;
      reorderTracksMut.mutate({ sorted: sortedTrilhas, from: fromIdx, to: toIdx });
      return;
    }

    const overId = String(over.id);
    if (from.kind === "modulo") {
      dropModulo(activeId, from.trackId, to, overId);
      return;
    }
    if (from.kind === "aula") {
      dropAula(activeId, from.moduleId, from.trackId, to, overId);
    }
  }

  function dropModulo(moduleId: string, fromTrackId: string, to: DropData, overId: string) {
    if (to.kind !== "modulo" && to.kind !== "modules-zone" && to.kind !== "track-header") return;
    const toTrackId = to.trackId;

    if (toTrackId === fromTrackId) {
      // Dentro da mesma trilha só há reordenação, e só faz sentido sobre outro módulo.
      if (to.kind !== "modulo" || overId === moduleId) return;
      const sorted = modulesOf(fromTrackId);
      const fromIdx = sorted.findIndex((m) => m.id === moduleId);
      const overIdx = sorted.findIndex((m) => m.id === overId);
      if (fromIdx === -1 || overIdx === -1) return;
      reorderModulesMut.mutate({ sorted, from: fromIdx, to: overIdx, trackId: fromTrackId });
      return;
    }

    const modulo = modulesOf(fromTrackId).find((m) => m.id === moduleId);
    if (!modulo) return;
    const srcIds = modulesOf(fromTrackId)
      .filter((m) => m.id !== moduleId)
      .map((m) => m.id);
    // Solto sobre outro módulo: posição exata. Solto numa zona/cabeçalho: no fim.
    const destIds =
      to.kind === "modulo"
        ? insertAt(modulesOf(toTrackId).map((m) => m.id), moduleId, overId)
        : null;
    moveModuleMut.mutate({ modulo, fromTrackId, toTrackId, destIds, srcIds });
  }

  function dropAula(
    lessonId: string,
    fromModuleId: string,
    fromTrackId: string,
    to: DropData,
    overId: string,
  ) {
    if (to.kind !== "aula" && to.kind !== "lessons-zone" && to.kind !== "module-header") return;
    const toModuleId = to.moduleId;
    const toTrackId = to.trackId;

    if (toModuleId === fromModuleId) {
      if (to.kind !== "aula" || overId === lessonId) return;
      const sorted = lessonsOf(fromTrackId, fromModuleId);
      const fromIdx = sorted.findIndex((a) => a.id === lessonId);
      const overIdx = sorted.findIndex((a) => a.id === overId);
      if (fromIdx === -1 || overIdx === -1) return;
      reorderLessonsMut.mutate({ sorted, from: fromIdx, to: overIdx, trackId: fromTrackId });
      return;
    }

    const aula = lessonsOf(fromTrackId, fromModuleId).find((a) => a.id === lessonId);
    if (!aula) return;
    const srcIds = lessonsOf(fromTrackId, fromModuleId)
      .filter((a) => a.id !== lessonId)
      .map((a) => a.id);
    const destIds =
      to.kind === "aula"
        ? insertAt(lessonsOf(toTrackId, toModuleId).map((a) => a.id), lessonId, overId)
        : null;
    moveLessonMut.mutate({
      aula,
      fromModuleId,
      fromTrackId,
      toModuleId,
      toTrackId,
      destIds,
      srcIds,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Trilhas</h1>
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
          collisionDetection={collisionDetection}
          // Containers surgem no meio do arraste (auto-expandir), então as medidas
          // precisam ser refeitas continuamente.
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTitle(null)}
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
                    setAulaModal({ open: true, moduleId, trackId: trilha.id, editing: null })
                  }
                  onEditAula={(moduleId, aula) =>
                    setAulaModal({ open: true, moduleId, trackId: trilha.id, editing: aula })
                  }
                  onDeleteAula={(id) => setDeleteTarget({ type: "aula", id })}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTitle !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-background px-3 py-2 shadow-lg">
                <GripVertical className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{activeTitle}</span>
              </div>
            )}
          </DragOverlay>
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
        trilhas={sortedTrilhas}
        onSuccess={refetchTracks}
      />
      <AulaModal
        open={aulaModal.open}
        onOpenChange={(o) => setAulaModal((p) => ({ ...p, open: o }))}
        moduleId={aulaModal.moduleId}
        trackId={aulaModal.trackId}
        editingAula={aulaModal.editing}
        trilhas={sortedTrilhas}
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
