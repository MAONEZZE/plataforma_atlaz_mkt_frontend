"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { listComunidade } from "@/lib/api/comunidade";
import { MentoradoCard } from "@/components/community/MentoradoCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/data/Pagination";

const PAGE_SIZE = 24;

export default function ComunidadePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["comunidade", page],
    queryFn: () => listComunidade({ page, page_size: PAGE_SIZE, include_admins: true }),
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comunidade</h1>
        <p className="text-sm text-muted-foreground">Conheça os outros mentorados da akeel</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar comunidade.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      )}

      {data && data.total === 0 && (
        <EmptyState
          icon={<Users className="size-8" />}
          title="A comunidade ainda está se formando."
          description="Volte em breve!"
        />
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((m) => (
              <MentoradoCard key={m.id} mentorado={m} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
