"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminStageFolders, type StageFolder } from "@/lib/api/admin";
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
});
type FormData = z.infer<typeof schema>;

interface FolderModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingFolder: StageFolder | null;
  nextOrder: number;
  onSuccess: () => void;
}

export function FolderModal({ open, onOpenChange, editingFolder, nextOrder, onSuccess }: FolderModalProps) {
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
    if (open) reset({ title: editingFolder?.title ?? "" });
  }, [open, editingFolder, reset]);

  const mut = useMutation({
    mutationFn: (data: FormData) =>
      editingFolder
        ? adminStageFolders.update(editingFolder.id, { title: data.title })
        : adminStageFolders.create({ title: data.title, order: nextOrder }),
    onSuccess: () => {
      toast.success(editingFolder ? "Pasta atualizada!" : "Pasta criada!");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar pasta."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{editingFolder ? "Editar pasta" : "Nova pasta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input {...register("title")} placeholder="Nome da pasta" />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
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
