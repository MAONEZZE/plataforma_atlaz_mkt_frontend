"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
});
type StageInput = z.infer<typeof stageSchema>;

export default function AdminEtapasPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });

  const [editing, setEditing] = useState<Stage | null>(null);
  const [deleting, setDeleting] = useState<Stage | null>(null);

  const createForm = useForm<StageInput>({
    resolver: zodResolver(stageSchema),
    defaultValues: { text: "" },
  });

  const editForm = useForm<StageInput>({
    resolver: zodResolver(stageSchema),
  });

  function openEdit(s: Stage) {
    editForm.reset({ text: s.text });
    setEditing(s);
  }

  const createMut = useMutation({
    mutationFn: (d: StageInput) => adminStages.create(d.text),
    onSuccess: () => {
      toast.success("Etapa criada!");
      createForm.reset({ text: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "stages"] });
    },
    onError: () => toast.error("Erro ao criar etapa."),
  });

  const editMut = useMutation({
    mutationFn: (d: StageInput) => adminStages.update(editing!.id, d.text),
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
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Left — create form */}
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Etapas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as etapas da plataforma.
          </p>
        </div>
        <GlassCard variant="solid" className="space-y-4">
          <h2 className="font-medium">Nova etapa</h2>
          <form
            onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label>Texto</Label>
              <Input
                {...createForm.register("text")}
                placeholder="Descreva a etapa..."
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
      </div>

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
            {data?.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm">{s.text}</span>
                <div className="flex items-center gap-1 shrink-0 ml-3">
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
            ))}
          </div>
        )}
      </GlassCard>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="glass max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Editar etapa</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label>Texto</Label>
              <Input {...editForm.register("text")} />
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
