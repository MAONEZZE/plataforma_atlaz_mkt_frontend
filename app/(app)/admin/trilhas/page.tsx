"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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

function swapAndReindex<T extends { id: string }>(arr: T[], idx: number, dir: "up" | "down") {
  const next = [...arr];
  const to = dir === "up" ? idx - 1 : idx + 1;
  [next[idx], next[to]] = [next[to], next[idx]];
  return next.map((item, i) => ({ id: item.id, order: i }));
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
    mutationFn: (vars: { sorted: Trilha[]; idx: number; dir: "up" | "down" }) =>
      adminTrilhas.reordenar({ order: swapAndReindex(vars.sorted, vars.idx, vars.dir) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      toast.success("Ordem atualizada.");
    },
    onError: () => toast.error("Erro ao reordenar."),
  });

  const reorderModulesMut = useMutation({
    mutationFn: (vars: { sorted: Modulo[]; idx: number; dir: "up" | "down"; trackId: string }) =>
      adminModulos.reordenar({ order: swapAndReindex(vars.sorted, vars.idx, vars.dir) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.trackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      toast.success("Ordem atualizada.");
    },
    onError: () => toast.error("Erro ao reordenar."),
  });

  const reorderLessonsMut = useMutation({
    mutationFn: (vars: { sorted: Aula[]; idx: number; dir: "up" | "down"; trackId: string }) =>
      adminAulas.reordenar({ order: swapAndReindex(vars.sorted, vars.idx, vars.dir) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["trilha", vars.trackId] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      toast.success("Ordem atualizada.");
    },
    onError: () => toast.error("Erro ao reordenar."),
  });

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
        <div className="space-y-2">
          {sortedTrilhas.map((trilha, trackIdx) => {
            const isExpanded = expandedTracks.has(trilha.id);
            const detail = trackDetails.get(trilha.id);
            return (
              <div key={trilha.id} className="solid-surface">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleTrack(trilha.id)}
                    className="flex items-center gap-1.5 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" />
                    )}
                    <span className="font-medium">{trilha.title}</span>
                  </button>
                  <span className="text-xs text-muted-foreground mr-2">
                    {trilha.total_lessons} aulas
                  </span>
                  <button
                    type="button"
                    disabled={trackIdx === 0 || reorderTracksMut.isPending}
                    onClick={() => reorderTracksMut.mutate({ sorted: sortedTrilhas, idx: trackIdx, dir: "up" })}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={trackIdx === sortedTrilhas.length - 1 || reorderTracksMut.isPending}
                    onClick={() => reorderTracksMut.mutate({ sorted: sortedTrilhas, idx: trackIdx, dir: "down" })}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrilhaModal({ open: true, editing: trilha })}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "trilha", id: trilha.id })}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setModuloModal({
                                open: true,
                                trackId: trilha.id,
                                editing: null,
                              })
                            }
                          >
                            <Plus className="mr-1 size-3.5" />
                            Adicionar módulo
                          </Button>
                        </div>
                        {detail.modules.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-2">
                            Nenhum módulo ainda.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {(() => {
                              const sortedModules = [...detail.modules].sort((a, b) => a.order - b.order);
                              return sortedModules.map((modulo, modIdx) => {
                                const isModExpanded = expandedModules.has(modulo.id);
                                const sortedLessons = [...modulo.lessons].sort((a, b) => a.order - b.order);
                                return (
                                  <div
                                    key={modulo.id}
                                    className="rounded-lg border border-border"
                                  >
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleModule(modulo.id)}
                                        className="flex items-center gap-1.5 flex-1 text-left"
                                      >
                                        {isModExpanded ? (
                                          <ChevronDown className="size-3.5 shrink-0" />
                                        ) : (
                                          <ChevronRight className="size-3.5 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium">
                                          {modulo.title}
                                        </span>
                                      </button>
                                      <span className="text-xs text-muted-foreground mr-2">
                                        {modulo.lessons.length} aulas
                                      </span>
                                      <button
                                        type="button"
                                        disabled={modIdx === 0 || reorderModulesMut.isPending}
                                        onClick={() => reorderModulesMut.mutate({ sorted: sortedModules, idx: modIdx, dir: "up", trackId: trilha.id })}
                                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        <ArrowUp className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={modIdx === sortedModules.length - 1 || reorderModulesMut.isPending}
                                        onClick={() => reorderModulesMut.mutate({ sorted: sortedModules, idx: modIdx, dir: "down", trackId: trilha.id })}
                                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        <ArrowDown className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setModuloModal({
                                            open: true,
                                            trackId: trilha.id,
                                            editing: modulo,
                                          })
                                        }
                                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                                      >
                                        <Pencil className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteTarget({ type: "modulo", id: modulo.id })
                                        }
                                        className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </div>
                                    {isModExpanded && (
                                      <div className="border-t border-border px-3 py-2 space-y-2 bg-background/40">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Aulas
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              setAulaModal({
                                                open: true,
                                                moduleId: modulo.id,
                                                editing: null,
                                              })
                                            }
                                          >
                                            <Plus className="mr-1 size-3.5" />
                                            Adicionar aula
                                          </Button>
                                        </div>
                                        {sortedLessons.length === 0 ? (
                                          <p className="text-xs text-muted-foreground italic py-1">
                                            Nenhuma aula ainda.
                                          </p>
                                        ) : (
                                          <div className="space-y-1">
                                            {sortedLessons.map((aula, aulaIdx) => (
                                              <div
                                                key={aula.id}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent"
                                              >
                                                <span className="text-sm flex-1 line-clamp-1">
                                                  {aula.title}
                                                </span>
                                                {aula.duration_minutes !== null && (
                                                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                    <Clock className="size-3" />
                                                    {aula.duration_minutes}min
                                                  </span>
                                                )}
                                                <button
                                                  type="button"
                                                  disabled={aulaIdx === 0 || reorderLessonsMut.isPending}
                                                  onClick={() => reorderLessonsMut.mutate({ sorted: sortedLessons, idx: aulaIdx, dir: "up", trackId: trilha.id })}
                                                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                  <ArrowUp className="size-3" />
                                                </button>
                                                <button
                                                  type="button"
                                                  disabled={aulaIdx === sortedLessons.length - 1 || reorderLessonsMut.isPending}
                                                  onClick={() => reorderLessonsMut.mutate({ sorted: sortedLessons, idx: aulaIdx, dir: "down", trackId: trilha.id })}
                                                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                  <ArrowDown className="size-3" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setAulaModal({
                                                      open: true,
                                                      moduleId: modulo.id,
                                                      editing: aula,
                                                    })
                                                  }
                                                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                                                >
                                                  <Pencil className="size-3" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setDeleteTarget({
                                                      type: "aula",
                                                      id: aula.id,
                                                    })
                                                  }
                                                  className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                                                >
                                                  <Trash2 className="size-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
