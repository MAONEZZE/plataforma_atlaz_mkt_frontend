"use client";

import { useQuery } from "@tanstack/react-query";
import { listProdutos } from "@/lib/api/produtos";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ProdutoPage() {
  const user = useCurrentUser();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
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
                variant={isMine ? "solid" : "soft"}
                className="flex flex-col gap-3 relative"
              >
                {isMine && (
                  <Badge className="absolute top-3 right-3 bg-primary/15 text-primary border-primary/30 text-xs">
                    Seu plano
                  </Badge>
                )}
                <p className="font-semibold text-base pr-20 break-all">{p.name}</p>
                <p className="text-2xl font-bold">{formatBRL(p.value)}</p>
                {p.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
                    {p.description}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
