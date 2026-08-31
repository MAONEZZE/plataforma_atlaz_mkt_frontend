"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminProdutos } from "@/lib/api/admin";
import type { Produto } from "@/lib/api/produtos";
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

function buildSchema(isCreate: boolean) {
  return z.object({
    name: z.string().min(1, "Nome obrigatório."),
    description: z.string().optional(),
    value: isCreate ? z.number().min(0, "Mínimo 0.") : z.number().optional(),
  });
}
type ProdutoFormInput = z.infer<ReturnType<typeof buildSchema>>;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ProdutoModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingProduto: Produto | null;
  onSuccess: () => void;
}

export function ProdutoModal({ open, onOpenChange, editingProduto, onSuccess }: ProdutoModalProps) {
  const isCreate = !editingProduto;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProdutoFormInput>({
    resolver: zodResolver(buildSchema(isCreate)),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editingProduto?.name ?? "",
        description: editingProduto?.description ?? "",
        value: 0,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
      setPreview(editingProduto?.cover_photo ?? null);
    }
  }, [open, editingProduto, reset]);

  const mut = useMutation({
    mutationFn: async (d: ProdutoFormInput) => {
      const cover_photo = file ? await fileToBase64(file) : preview;
      const payload = {
        name: d.name,
        description: d.description?.trim() ? d.description.trim() : null,
        cover_photo,
      };
      if (editingProduto) {
        return adminProdutos.update(editingProduto.id, payload);
      }
      return adminProdutos.create({ ...payload, value: d.value ?? 0 });
    },
    onSuccess: () => {
      toast.success(editingProduto ? "Produto atualizado!" : "Produto criado!");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(editingProduto ? "Erro ao atualizar produto." : "Erro ao criar produto.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm glass" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{editingProduto ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input {...register("name")} placeholder="Nome do produto" />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          {isCreate && (
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                {...register("value", { valueAsNumber: true })}
                placeholder="0,00"
              />
              {errors.value && <p className="text-xs text-danger">{errors.value.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Foto de capa (opcional)</Label>
            <CoverPhotoUpload
              preview={preview}
              onFileSelect={(f, url) => { setFile(f); setPreview(url); }}
              onClear={() => { setFile(null); setPreview(null); }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <textarea
              {...register("description")}
              placeholder="Descrição do produto"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
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
