"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, Trophy, ArrowRight, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  getAula,
  concluirAula,
  desmarcarAula,
  type TrilhaDetalhe,
} from "@/lib/api/conteudo";
import { DriveVideoPlayer } from "@/components/content/DriveVideoPlayer";
import { CommentsList } from "@/components/content/CommentsList";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function nextAula(trilha: TrilhaDetalhe, currentAulaId: string) {
  const sortedMods = [...trilha.modules].sort((a, b) => a.order - b.order);
  const all = sortedMods.flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
  const idx = all.findIndex((a) => a.id === currentAulaId);
  if (idx === -1 || idx >= all.length - 1) return null;
  return all[idx + 1];
}

function docFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    return last ? decodeURIComponent(last) : "documento";
  } catch {
    return "documento";
  }
}

function isPdf(url: string) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function DocumentCard({ url, title }: { url: string; title: string }) {
  const name = docFilename(url);
  const pdf = isPdf(url);
  return (
    <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
      {pdf ? (
        <iframe
          src={url}
          className="w-full border-0"
          style={{ height: "80vh", minHeight: 480 }}
          title={title}
        />
      ) : (
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <FileText className="size-16 text-primary" />
          <div className="space-y-1">
            <p className="text-lg font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-sm text-muted-foreground truncate">{name}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          <Download className="size-4" /> Baixar
        </a>
      </div>
    </div>
  );
}

export default function AulaPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: aula, isLoading: aulaLoading } = useQuery({
    queryKey: ["aula", id],
    queryFn: () => getAula(id),
  });

  const { data: trilha } = useQuery({
    queryKey: ["trilha", aula?.module_id],
    queryFn: async () => {
      if (!aula) return null;
      const modId = aula.module_id;
      const all = qc.getQueriesData<TrilhaDetalhe>({ queryKey: ["trilha"] });
      for (const [, t] of all) {
        if (t?.modules.some((m) => m.id === modId)) return t;
      }
      return null;
    },
    enabled: !!aula,
  });

  const toggleMut = useMutation({
    mutationFn: async () => {
      if (!aula) return;
      if (aula.completed) {
        await desmarcarAula(id);
      } else {
        await concluirAula(id);
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["aula", id] });
      const prev = qc.getQueryData(["aula", id]);
      qc.setQueryData(["aula", id], (old: typeof aula) =>
        old ? { ...old, completed: !old.completed } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["aula", id], ctx?.prev);
      toast.error("Erro ao atualizar progresso.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilha"] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
    },
  });

  if (aulaLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!aula) return <div className="text-danger">Aula não encontrada.</div>;

  const next = trilha ? nextAula(trilha, id) : null;
  const isLast = trilha && !next;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Main column */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        {trilha && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/trilhas" className="hover:text-foreground transition-colors">Trilhas</Link>
            <span>/</span>
            <Link href={`/trilhas/${trilha.id}`} className="hover:text-foreground transition-colors line-clamp-1">
              {trilha.title}
            </Link>
          </div>
        )}

        {/* Player or document */}
        {aula.is_doc && aula.drive_file_id ? (
          <DocumentCard url={aula.drive_file_id} title={aula.title} />
        ) : !aula.is_doc && aula.drive_file_id ? (
          <DriveVideoPlayer fileId={aula.drive_file_id} className="rounded-2xl overflow-hidden" />
        ) : null}

        {/* Title + progress toggle */}
        <div className="space-y-3 flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">{aula.title}</h1>
            {aula.duration_minutes && (
              <p className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="size-4" />
                {aula.duration_minutes} minutos
              </p>
            )}
          </div>

          <div className="flex items-start gap-3">
            {aula.completed ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 className="size-4" /> Concluída
                </span>
                <button
                  onClick={() => toggleMut.mutate()}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Desmarcar
                </button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => toggleMut.mutate()}
                disabled={toggleMut.isPending}
              >
                Marcar como concluída
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          {aula.description && <h2 className="text-xl font-semibold">Sobre a aula</h2>}
          {aula.description && <p className="text-sm text-muted-foreground">{aula.description}</p>}
        </div>

        {/* Next aula card */}
        {next && (
          <GlassCard variant="soft" className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Próxima aula</p>
              <p className="text-sm font-medium line-clamp-1">{next.title}</p>
            </div>
            <Link
              href={`/aulas/${next.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 shrink-0"
            >
              Ir para a próxima <ArrowRight className="size-3.5" />
            </Link>
          </GlassCard>
        )}

        {isLast && aula.completed && (
          <GlassCard variant="soft" className="flex items-center gap-3 text-success">
            <Trophy className="size-6 shrink-0" />
            <div>
              <p className="font-semibold">Trilha concluída!</p>
              <p className="text-xs opacity-80">Parabéns por terminar esta trilha.</p>
            </div>
          </GlassCard>
        )}

        <Separator />

        {/* Comments */}
        <CommentsList aulaId={id} />
      </div>

      {/* Sidebar (desktop only) */}
      {trilha && (
        <aside className="hidden lg:block space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Módulos
          </h2>
          {[...trilha.modules].sort((a, b) => a.order - b.order).map((modulo) => (
            <div key={modulo.id} className="solid-surface p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{modulo.title}</p>
              {[...modulo.lessons].sort((a, b) => a.order - b.order).map((a) => (
                <Link
                  key={a.id}
                  href={`/aulas/${a.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors",
                    a.id === id && "bg-primary/10 text-primary font-medium",
                  )}
                >
                  {a.completed ? (
                    <CheckCircle2 className="size-3 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="line-clamp-1">{a.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </aside>
      )}
    </div>
  );
}
