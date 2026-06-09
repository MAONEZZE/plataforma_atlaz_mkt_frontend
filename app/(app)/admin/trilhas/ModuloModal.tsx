"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminModulos } from "@/lib/api/admin";
import type { Modulo } from "@/lib/api/conteudo";
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
  onSuccess: () => void;
}

export function ModuloModal({
  open,
  onOpenChange,
  trackId,
  editingModulo,
  onSuccess,
}: ModuloModalProps) {
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
      reset({
        title: editingModulo?.title ?? "",
        description: editingModulo?.description ?? "",
        order: editingModulo?.order ?? 0,
      });
    }
  }, [open, editingModulo, reset]);

  const mut = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        order: data.order ?? 0,
      };
      if (editingModulo) {
        return adminModulos.update(editingModulo.id, payload);
      }
      return adminModulos.create({ track_id: trackId, ...payload });
    },
    onSuccess: () => {
      toast.success(editingModulo ? "Módulo atualizado!" : "Módulo criado!");
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
          <div className="space-y-1.5">
            <Label>Ordem</Label>
            <Input
              type="number"
              min={0}
              {...register("order", { valueAsNumber: true })}
            />
          </div>
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
