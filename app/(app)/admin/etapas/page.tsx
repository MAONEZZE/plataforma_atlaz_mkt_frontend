"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminStages, type Stage } from "@/lib/api/admin";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
});
type StageFormInput = z.infer<typeof stageSchema>;

export default function AdminEtapasPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });

  const [editing, setEditing] = useState<Stage | null>(null);
  const [deleting, setDeleting] = useState<Stage | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const createForm = useForm<StageFormInput>({
    resolver: zodResolver(stageSchema),
    defaultValues: { text: "", title: "" },
  });

  const editForm = useForm<StageFormInput>({
    resolver: zodResolver(stageSchema),
  });

  function openEdit(s: Stage) {
    editForm.reset({ text: s.text, title: s.title ?? "" });
    setEditing(s);
  }

  function toPayload(d: StageFormInput) {
    return {
      text: d.text,
      title: d.title?.trim() ? d.title.trim() : null,
    };
  }

  const createMut = useMutation({
    mutationFn: (d: StageFormInput) => adminStages.create(toPayload(d)),
    onSuccess: () => {
      toast.success("Etapa criada!");
      createForm.reset({ text: "", title: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao criar etapa."),
  });

  const editMut = useMutation({
    mutationFn: (d: StageFormInput) => adminStages.update(editing!.id, toPayload(d)),
    onSuccess: () => {
      toast.success("Etapa atualizada!");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao atualizar etapa."),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminStages.remove(deleting!.id),
    onSuccess: () => {
      toast.success("Etapa removida.");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao remover etapa."),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Etapas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie as etapas da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* Left — create form */}
        <GlassCard variant="solid" className="space-y-4">
          <h2 className="font-medium">Nova etapa</h2>
          <form
            onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label>Título (opcional)</Label>
              <Input
                {...createForm.register("title")}
                placeholder="Título da etapa"
              />
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
                <p className="text-xs text-danger">
                  {createForm.formState.errors.text.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Criando..." : "Criar etapa"}
            </Button>
          </form>
        </GlassCard>

        {/* Right — stages list */}
        <GlassCard variant="solid" className="space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Etapas cadastradas</h2>
          <span className="text-xs text-muted-foreground">
            {data?.length ?? 0} registros
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : data?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma etapa ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {data?.map((s) => {
              const isOpen = expanded.has(s.id);
              const label = s.title?.trim() ? s.title : s.text;
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      aria-expanded={isOpen}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                      <span className="text-sm font-medium truncate min-w-0">{label}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(s)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-0 border-t border-border/40">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all pt-2">
                        {s.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </GlassCard>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Editar etapa</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
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
                <p className="text-xs text-danger">
                  {editForm.formState.errors.text.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                variant="primary"
                disabled={editMut.isPending}
              >
                {editMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta etapa será removida permanentemente de todos os clientes.
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
    </div>
  );
}
