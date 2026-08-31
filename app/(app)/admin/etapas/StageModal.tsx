"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminStages, adminStageFolders, type Stage } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UNFILED_VALUE = "__unfiled__";

const schema = z.object({
  text: z.string().min(1, "Texto obrigatório."),
  title: z.string().optional(),
  folder_id: z.string(),
  order: z.number().int().min(0, "Mínimo 0."),
});
type FormData = z.infer<typeof schema>;

interface StageModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingStage: Stage | null;
  nextOrder: number;
  onSuccess: () => void;
}

export function StageModal({ open, onOpenChange, editingStage, nextOrder, onSuccess }: StageModalProps) {
  const { data: folders } = useQuery({
    queryKey: ["admin", "stage-folders"],
    queryFn: adminStageFolders.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      reset({
        text: editingStage?.text ?? "",
        title: editingStage?.title ?? "",
        folder_id: editingStage?.folder_id ?? UNFILED_VALUE,
        order: editingStage?.order ?? nextOrder,
      });
    }
  }, [open, editingStage, nextOrder, reset]);

  const mut = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        text: d.text,
        title: d.title?.trim() ? d.title.trim() : null,
        folder_id: d.folder_id === UNFILED_VALUE ? null : d.folder_id,
        order: d.order,
      };
      return editingStage
        ? adminStages.update(editingStage.id, payload)
        : adminStages.create(payload);
    },
    onSuccess: () => {
      toast.success(editingStage ? "Etapa atualizada!" : "Etapa criada!");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar etapa."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>{editingStage ? "Editar etapa" : "Nova etapa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Título (opcional)</Label>
            <Input {...register("title")} placeholder="Título da etapa" />
          </div>
          <div className="space-y-1.5">
            <Label>Texto</Label>
            <textarea
              {...register("text")}
              placeholder="Descreva a etapa..."
              rows={5}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
            {errors.text && <p className="text-xs text-danger">{errors.text.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pasta</Label>
              <Controller
                name="folder_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => { if (v !== null) field.onChange(v); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNFILED_VALUE}>Sem pasta</SelectItem>
                      {folders?.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input type="number" min={0} {...register("order", { valueAsNumber: true })} />
              {errors.order && <p className="text-xs text-danger">{errors.order.message}</p>}
            </div>
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
