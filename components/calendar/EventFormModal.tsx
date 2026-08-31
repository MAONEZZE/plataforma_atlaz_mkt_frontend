"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminEventos, type EventOut } from "@/lib/api/eventos";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoverPhotoUpload } from "@/components/ui/CoverPhotoUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const eventFormSchema = z.object({
  title: z.string().min(1, "Título obrigatório."),
  date: z.string().min(1, "Data obrigatória."),
  description: z.string().optional(),
});
type EventFormInput = z.infer<typeof eventFormSchema>;

interface EventFormModalProps {
  event?: EventOut | null;
  defaultDate?: string;
  onClose: () => void;
}

export function EventFormModal({ event, defaultDate, onClose }: EventFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(event?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(event?.id ?? null);
  const [imageFailed, setImageFailed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title ?? "",
      date: event?.date ?? defaultDate ?? "",
      description: event?.description ?? "",
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["eventos"] });
  }

  async function uploadPendingImage(id: string): Promise<boolean> {
    if (!file) return true;
    try {
      await adminEventos.uploadImage(id, file);
      setImageFailed(false);
      setFile(null);
      invalidate();
      return true;
    } catch (err) {
      setImageFailed(true);
      toast.error(getApiErrorMessage(err, "Erro ao enviar imagem."));
      return false;
    }
  }

  async function onSubmit(d: EventFormInput) {
    setSaving(true);
    try {
      const input = {
        title: d.title,
        date: d.date,
        description: d.description?.trim() ? d.description.trim() : null,
        client_id: null,
      };

      const result = savedId
        ? await adminEventos.update(savedId, input)
        : await adminEventos.create(input);

      setSavedId(result.id);
      invalidate();

      const imageOk = await uploadPendingImage(result.id);

      if (imageOk) {
        toast.success(isEditing ? "Evento atualizado!" : "Evento criado!");
        onClose();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar evento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar — ${event.title}` : "Nova data"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register("title")} placeholder="Título do evento" />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Descrição do evento..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Imagem (opcional)</Label>
            <CoverPhotoUpload
              preview={preview}
              onFileSelect={(f, url) => { setFile(f); setPreview(url); setImageFailed(false); }}
              onClear={() => { setFile(null); setPreview(null); }}
            />
            {imageFailed && savedId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!file || saving}
                onClick={() => uploadPendingImage(savedId)}
              >
                Enviar imagem novamente
              </Button>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
