"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, X, FileText } from "lucide-react";
import { adminAulas } from "@/lib/api/admin";
import { getTrilha, type Aula, type Trilha } from "@/lib/api/conteudo";
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
  trackId: string;
  editingAula: Aula | null;
  /** Trilhas disponíveis como destino ao mover uma aula já existente. */
  trilhas: Trilha[];
  onSuccess: () => void;
}

export function AulaModal({
  open,
  onOpenChange,
  moduleId,
  trackId,
  editingAula,
  trilhas,
  onSuccess,
}: AulaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"video" | "doc">("video");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [targetTrackId, setTargetTrackId] = useState(trackId);
  const [targetModuleId, setTargetModuleId] = useState(moduleId);

  // Só a trilha escolhida traz seus módulos; por isso o destino é em dois passos.
  const { data: targetTrack, isFetching: loadingModules } = useQuery({
    queryKey: ["trilha", targetTrackId],
    queryFn: () => getTrilha(targetTrackId),
    enabled: open && !!editingAula && !!targetTrackId,
  });
  const targetModules = targetTrack
    ? [...targetTrack.modules].sort((a, b) => a.order - b.order)
    : [];

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
      setTargetTrackId(trackId);
      setTargetModuleId(moduleId);
      reset({
        title: editingAula?.title ?? "",
        description: "",
        drive_url: "",
        duration_minutes: editingAula?.duration_minutes ?? undefined,
        order: editingAula?.order ?? 0,
      });
    }
  }, [open, trackId, moduleId, editingAula, reset]);

  function handleTrackChange(nextTrackId: string) {
    setTargetTrackId(nextTrackId);
    // O módulo atual não pertence à nova trilha; escolher um só faz sentido
    // depois que os módulos dela carregarem.
    setTargetModuleId(nextTrackId === trackId ? moduleId : "");
  }

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

  const isMoving = !!editingAula && !!targetModuleId && targetModuleId !== moduleId;

  /**
   * Ao mudar de módulo, manda `module_id` e omite `order`: o backend anexa no fim
   * do destino, enquanto reaproveitar a posição antiga colidiria com as aulas
   * que já estão lá.
   */
  function placement(order: number | undefined) {
    return isMoving ? { module_id: targetModuleId } : { order: order ?? 0 };
  }

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingAula && !targetModuleId) {
        throw new Error("Escolha o módulo de destino.");
      }
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
          ...(document_url ? { document_url } : {}),
        };
        if (editingAula) {
          return adminAulas.update(editingAula.id, { ...payload, ...placement(data.order) });
        }
        return adminAulas.create({ module_id: moduleId, order: data.order ?? 0, ...payload });
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
        duration_minutes:
          typeof dur === "number" && Number.isFinite(dur) && dur >= 0 ? Math.floor(dur) : undefined,
      };
      if (editingAula) {
        return adminAulas.update(editingAula.id, { ...payload, ...placement(data.order) });
      }
      return adminAulas.create({ module_id: moduleId, order: data.order ?? 0, ...payload });
    },
    onSuccess: () => {
      toast.success(isMoving ? "Aula movida!" : editingAula ? "Aula atualizada!" : "Aula criada!");
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

          {editingAula && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Trilha</Label>
                <select
                  value={targetTrackId}
                  onChange={(e) => handleTrackChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {trilhas.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Módulo</Label>
                <select
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  disabled={loadingModules}
                  className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60"
                >
                  <option value="">
                    {loadingModules
                      ? "Carregando..."
                      : targetModules.length === 0
                        ? "Trilha sem módulos"
                        : "Escolher módulo"}
                  </option>
                  {targetModules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              {isMoving && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  A aula vai para o fim do módulo escolhido.
                </p>
              )}
            </div>
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
