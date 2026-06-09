"use client";

import { useEffect, useState } from "react";
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
import { CoverPhotoUpload } from "@/components/ui/CoverPhotoUpload";
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

interface TrilhaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTrilha: Trilha | null;
  onSuccess: () => void;
}


export function TrilhaModal({ open, onOpenChange, editingTrilha, onSuccess }: TrilhaModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
        title: editingTrilha?.title ?? "",
        description: editingTrilha?.description ?? "",
        order: editingTrilha?.order ?? 0,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
      setPreview(editingTrilha?.cover_url ?? null);
    }
  }, [open, editingTrilha, reset]);

  function clearFile() {
    setFile(null);
    setPreview(null);
  }

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      let cover_url: string | null | undefined;
      if (file) {
        cover_url = await adminTrilhas.uploadCover(file);
      } else {
        cover_url = preview;
      }
      const payload = {
        title: data.title,
        description: data.description || undefined,
        cover_url,
        order: data.order ?? 0,
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
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Imagem de capa (opcional)</Label>
            <CoverPhotoUpload
              preview={preview}
              onFileSelect={(f, url) => { setFile(f); setPreview(url); }}
              onClear={clearFile}
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
