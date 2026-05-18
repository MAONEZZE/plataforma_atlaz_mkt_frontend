"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminTrilhas } from "@/lib/api/admin";
import type { Trilha } from "@/lib/api/conteudo";
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
  titulo: z.string().min(1, "Título obrigatório."),
  descricao: z.string().optional(),
  capa_url: z.string().url("URL inválida.").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

interface TrilhaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTrilha: Trilha | null;
  onSuccess: () => void;
}

export function TrilhaModal({ open, onOpenChange, editingTrilha, onSuccess }: TrilhaModalProps) {
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
        titulo: editingTrilha?.titulo ?? "",
        descricao: editingTrilha?.descricao ?? "",
        capa_url: editingTrilha?.capa_url ?? "",
      });
    }
  }, [open, editingTrilha, reset]);

  const mut = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        titulo: data.titulo,
        descricao: data.descricao || undefined,
        capa_url: data.capa_url || undefined,
      };
      if (editingTrilha) {
        return adminTrilhas.update(editingTrilha.id, payload);
      }
      return adminTrilhas.create(payload);
    },
    onSuccess: () => {
      toast.success(editingTrilha ? "Trilha atualizada!" : "Trilha criada!");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar trilha."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>{editingTrilha ? "Editar trilha" : "Nova trilha"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((d) => mut.mutate(d))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input {...register("titulo")} />
            {errors.titulo && <p className="text-xs text-danger">{errors.titulo.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input {...register("descricao")} />
          </div>
          <div className="space-y-1.5">
            <Label>URL da capa (opcional)</Label>
            <Input {...register("capa_url")} placeholder="https://..." />
            {errors.capa_url && <p className="text-xs text-danger">{errors.capa_url.message}</p>}
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
