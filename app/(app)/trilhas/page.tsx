"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { listTrilhas } from "@/lib/api/conteudo";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 0 ? "bg-muted-foreground/30" : pct === 100 ? "bg-success" : "bg-primary";
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function TrilhasPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trilhas"],
    queryFn: listTrilhas,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trilhas</h1>
        <p className="text-sm text-muted-foreground">Aprendizado estruturado por temas</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar trilhas.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={<BookOpen className="size-8" />}
          title="Ainda não há trilhas disponíveis."
        />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((trilha) => {
            const pct =
              trilha.total_lessons > 0
                ? Math.round((trilha.lessons_completed / trilha.total_lessons) * 100)
                : 0;
            return (
              <Link
                key={trilha.id}
                href={`/trilhas/${trilha.id}`}
                className="solid-surface overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
              >
                <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {trilha.cover_url ? (
                    <Image
                      src={trilha.cover_url}
                      alt={trilha.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <BookOpen className="size-10 text-primary/40" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h2 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {trilha.title}
                  </h2>
                  {trilha.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{trilha.description}</p>
                  )}
                  <div className="mt-auto space-y-1.5">
                    <ProgressBar pct={pct} />
                    <p className="text-xs text-muted-foreground">
                      {trilha.lessons_completed} de {trilha.total_lessons} aulas — {pct}%
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
