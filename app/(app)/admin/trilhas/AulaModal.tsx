"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminAulas } from "@/lib/api/admin";
import type { Aula } from "@/lib/api/conteudo";
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
  drive_url: z.string().url("URL inválida."),
});
type FormData = z.infer<typeof schema> & { duration_minutes?: number };

interface AulaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  moduleId: string;
  editingAula: Aula | null;
  onSuccess: () => void;
}

export function AulaModal({
  open,
  onOpenChange,
  moduleId,
  editingAula,
  onSuccess,
}: AulaModalProps) {
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
        title: editingAula?.title ?? "",
        description: "",
        drive_url: "",
        duration_minutes: editingAula?.duration_minutes ?? undefined,
      });
    }
  }, [open, editingAula, reset]);

  const mut = useMutation({
    mutationFn: (data: FormData) => {
      const dur = data.duration_minutes;
      const payload = {
        title: data.title,
        description: data.description || undefined,
        drive_url: data.drive_url,
        duration_minutes:
          typeof dur === "number" && Number.isFinite(dur) && dur >= 0 ? Math.floor(dur) : undefined,
      };
      if (editingAula) {
        return adminAulas.update(editingAula.id, payload);
      }
      return adminAulas.create({ module_id: moduleId, ...payload });
    },
    onSuccess: () => {
      toast.success(editingAula ? "Aula atualizada!" : "Aula criada!");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar aula."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>{editingAula ? "Editar aula" : "Nova aula"}</DialogTitle>
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
            <Label>URL do Google Drive</Label>
            <Input
              {...register("drive_url")}
              placeholder="https://drive.google.com/file/d/..."
            />
            {errors.drive_url && (
              <p className="text-xs text-danger">{errors.drive_url.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Duração em minutos (opcional)</Label>
            <Input
              type="number"
              min={0}
              {...register("duration_minutes", { valueAsNumber: true })}
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
