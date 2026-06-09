"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { getTrilha } from "@/lib/api/conteudo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 0 ? "bg-muted-foreground/30" : pct === 100 ? "bg-success" : "bg-primary";
  return (
    <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function TrilhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: trilha, isLoading } = useQuery({
    queryKey: ["trilha", id],
    queryFn: () => getTrilha(id),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!trilha) return <div className="text-danger">Trilha não encontrada.</div>;

  const sortedModules = [...trilha.modules].sort((a, b) => a.order - b.order);
  const allAulas = sortedModules.flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
  const totalAulas = allAulas.length;
  const aulasConcluidas = allAulas.filter((a) => a.completed).length;
  const pct = Math.round(trilha.progress_pct);
  const nextAula = allAulas.find((a) => !a.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 text-white"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--primary) 80%, transparent), color-mix(in srgb, var(--primary) 40%, transparent))`,
        }}
      >
        <Link
          href="/trilhas"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4"
        >
          <ChevronLeft className="size-4" />
          Voltar para Trilhas
        </Link>
        <h1 className="text-2xl font-bold">{trilha.title}</h1>
        {trilha.description && <p className="mt-1 text-sm text-white/80 max-w-lg">{trilha.description}</p>}
        <div className="mt-4 space-y-1.5 max-w-sm">
          <ProgressBar pct={pct} />
          <p className="text-xs text-white/70">
            {aulasConcluidas} de {totalAulas} aulas — {pct}%
          </p>
        </div>
      </div>

      {/* Modules accordion */}
      {trilha.modules.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum módulo nesta trilha.</p>
      ) : (
        <Accordion defaultValue={sortedModules[0]?.id ? [sortedModules[0].id] : []}>
          {sortedModules.map((modulo) => (
            <AccordionItem key={modulo.id} value={modulo.id} className="solid-surface mb-3 rounded-xl border-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{modulo.title}</span>
                  <span className="text-xs text-muted-foreground">({modulo.lessons.length} aulas)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {[...modulo.lessons].sort((a, b) => a.order - b.order).map((aula) => {
                    const isNext = aula.id === nextAula?.id;
                    return (
                      <Link
                        key={aula.id}
                        href={`/aulas/${aula.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors",
                          isNext && "border-l-2 border-primary bg-primary/5",
                        )}
                      >
                        {aula.completed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 line-clamp-1">{aula.title}</span>
                        {isNext && (
                          <span className="text-xs font-medium text-primary shrink-0">Continuar</span>
                        )}
                        {aula.duration_minutes && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                            <Clock className="size-3" />
                            {aula.duration_minutes}min
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
