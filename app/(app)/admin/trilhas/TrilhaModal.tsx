"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
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
  title: z.string().min(1, "Título obrigatório."),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface TrilhaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTrilha: Trilha | null;
  onSuccess: () => void;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function TrilhaModal({ open, onOpenChange, editingTrilha, onSuccess }: TrilhaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
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
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
      setPreview(editingTrilha?.cover_url ?? null);
    }
  }, [open, editingTrilha, reset]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearFile() {
    setFile(null);
    setPreview(editingTrilha?.cover_url ?? null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      let cover_url: string | undefined = editingTrilha?.cover_url ?? undefined;
      if (file) {
        cover_url = await adminTrilhas.uploadCover(file);
      }
      const payload = {
        title: data.title,
        description: data.description || undefined,
        cover_url,
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
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Capa" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-1.5 right-1.5 size-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <ImagePlus className="size-6" />
                <span className="text-sm">Escolher imagem do computador</span>
                <span className="text-xs">JPG, PNG ou WebP — máx 5MB</span>
              </button>
            )}
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
