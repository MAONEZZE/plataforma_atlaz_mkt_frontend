"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProdutos, type Produto } from "@/lib/api/produtos";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProdutoPage() {
  const user = useCurrentUser();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });
  const [selected, setSelected] = useState<Produto | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Produtos disponíveis na plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar produtos.
          <button className="underline text-xs" onClick={() => refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : data?.length === 0 ? (
        <GlassCard variant="soft" className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            Nenhum produto cadastrado.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((p) => {
            const isMine = user?.product_name === p.name;
            return (
              <GlassCard
                key={p.id}
                as="button"
                variant={isMine ? "solid" : "soft"}
                className="flex flex-col gap-0 relative overflow-hidden p-0 h-64 text-left cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => setSelected(p)}
              >
                {p.cover_photo && (
                  <img
                    src={p.cover_photo}
                    alt={p.name}
                    className="w-full h-36 object-cover shrink-0"
                  />
                )}
                <div className="flex flex-col gap-3 p-4 relative min-h-0">
                  {isMine && (
                    <Badge className="absolute top-3 right-3 bg-primary/15 text-primary border-primary/30 text-xs">
                      Seu plano
                    </Badge>
                  )}
                  <p className="font-semibold text-base pr-20 break-all">{p.name}</p>
                  {p.description && (
                    <p className="text-sm text-muted-foreground break-all line-clamp-3">
                      {p.description}
                    </p>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              {selected.cover_photo && (
                <img
                  src={selected.cover_photo}
                  alt={selected.name}
                  className="w-full h-40 object-cover rounded-lg -mt-2"
                />
              )}
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              {selected.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {selected.description}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
