"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminModulos } from "@/lib/api/admin";
import type { Modulo, Trilha } from "@/lib/api/conteudo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  title: z.string().min(1, "Título obrigatório."),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
});
type FormData = z.infer<typeof schema>;

interface ModuloModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trackId: string;
  editingModulo: Modulo | null;
  /** Trilhas disponíveis como destino ao mover um módulo já existente. */
  trilhas: Trilha[];
  onSuccess: () => void;
}

export function ModuloModal({
  open,
  onOpenChange,
  trackId,
  editingModulo,
  trilhas,
  onSuccess,
}: ModuloModalProps) {
  const [targetTrackId, setTargetTrackId] = useState(trackId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetTrackId(trackId);
      reset({
        title: editingModulo?.title ?? "",
        description: editingModulo?.description ?? "",
        order: editingModulo?.order ?? 0,
      });
    }
  }, [open, trackId, editingModulo, reset]);

  const isMoving = !!editingModulo && targetTrackId !== trackId;

  const mut = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        // Ao mudar de trilha, deixa o backend anexar no fim: reaproveitar a
        // posição antiga colidiria com os módulos que já estão no destino.
        ...(isMoving ? { track_id: targetTrackId } : { order: data.order ?? 0 }),
      };
      if (editingModulo) {
        return adminModulos.update(editingModulo.id, payload);
      }
      return adminModulos.create({ track_id: trackId, ...payload });
    },
    onSuccess: () => {
      toast.success(
        isMoving ? "Módulo movido!" : editingModulo ? "Módulo atualizado!" : "Módulo criado!",
      );
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar módulo."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>{editingModulo ? "Editar módulo" : "Novo módulo"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((d) => mut.mutate(d))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input {...register("description")} />
          </div>
          {editingModulo && (
            <div className="space-y-1.5">
              <Label>Trilha</Label>
              <select
                value={targetTrackId}
                onChange={(e) => setTargetTrackId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                {trilhas.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              {isMoving && (
                <p className="text-xs text-muted-foreground">
                  O módulo e suas aulas vão para o fim da trilha escolhida.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground px-3"
            >
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={!isValid || mut.isPending}>
              {mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
