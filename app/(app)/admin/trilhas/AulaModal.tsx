"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, X, FileText } from "lucide-react";
import { adminAulas } from "@/lib/api/admin";
import type { Aula } from "@/lib/api/conteudo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  drive_url: z.string().optional(),
  order: z.number().int().min(0).optional(),
});
type FormData = z.infer<typeof schema> & { duration_minutes?: number };

const ALLOWED_DOC = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_DOC = 50 * 1024 * 1024;

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"video" | "doc">("video");
  const [docFile, setDocFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      const initialMode: "video" | "doc" = editingAula?.is_doc ? "doc" : "video";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(initialMode);
      setDocFile(null);
      reset({
        title: editingAula?.title ?? "",
        description: "",
        drive_url: "",
        duration_minutes: editingAula?.duration_minutes ?? undefined,
        order: editingAula?.order ?? 0,
      });
    }
  }, [open, editingAula, reset]);

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_DOC.includes(f.type)) {
      toast.error("Formato inválido. Use PDF, TXT, DOC ou DOCX.");
      return;
    }
    if (f.size > MAX_DOC) {
      toast.error("Arquivo muito grande. Máximo 50MB.");
      return;
    }
    setDocFile(f);
  }

  function clearDoc() {
    setDocFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      if (mode === "doc") {
        if (!docFile && !editingAula) {
          throw new Error("Selecione um documento.");
        }
        let document_url: string | undefined;
        if (docFile) {
          document_url = await adminAulas.uploadDocument(docFile, data.title);
        }
        const payload = {
          title: data.title,
          is_doc: true,
          order: data.order ?? 0,
          ...(document_url ? { document_url } : {}),
        };
        if (editingAula) {
          return adminAulas.update(editingAula.id, payload);
        }
        return adminAulas.create({ module_id: moduleId, ...payload });
      }

      if (!data.drive_url) throw new Error("URL do Google Drive obrigatória.");
      try {
        new URL(data.drive_url);
      } catch {
        throw new Error("URL inválida.");
      }

      const dur = data.duration_minutes;
      const payload = {
        title: data.title,
        description: data.description || undefined,
        drive_url: data.drive_url,
        is_doc: false,
        order: data.order ?? 0,
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
    onError: (err: Error) => toast.error(err.message || "Erro ao salvar aula."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
            <Label>Ordem</Label>
            <Input
              type="number"
              min={0}
              {...register("order", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{mode === "doc" ? "Documento" : "Descrição (opcional)"}</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "video" | "doc")}>
                <TabsList className="h-7">
                  <TabsTrigger value="video" className="text-xs px-2.5">
                    Vídeo
                  </TabsTrigger>
                  <TabsTrigger value="doc" className="text-xs px-2.5">
                    Doc
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {mode === "video" ? (
              <Input {...register("description")} />
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hidden
                  onChange={handleDocChange}
                />
                {docFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                    <FileText className="size-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{docFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(docFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearDoc}
                      className="size-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-24 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    <FileUp className="size-5" />
                    <span className="text-sm">Escolher documento</span>
                    <span className="text-xs">PDF, TXT, DOC ou DOCX — máx 50MB</span>
                  </button>
                )}
              </>
            )}
          </div>

          {mode === "video" && (
            <>
              <div className="space-y-1.5">
                <Label>URL do Google Drive</Label>
                <Input
                  {...register("drive_url")}
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração em minutos (opcional)</Label>
                <Input
                  type="number"
                  min={0}
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground px-3"
            >
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={mut.isPending}>
              {mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
