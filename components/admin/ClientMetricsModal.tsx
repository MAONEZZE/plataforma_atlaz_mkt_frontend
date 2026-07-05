"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthPicker } from "@/components/forms/MonthPicker";
import { PlanilhaView } from "@/components/metrics/PlanilhaView";
import { MetricsLineChart } from "@/components/metrics/MetricsLineChart";
import { Button } from "@/components/ui/button";
import { getClientSheet } from "@/lib/api/admin";

interface ClientMetricsModalProps {
  clientId: string | null;
  clientName?: string;
  onOpenChange: (open: boolean) => void;
}

export function ClientMetricsModal({ clientId, clientName, onOpenChange }: ClientMetricsModalProps) {
  const router = useRouter();
  const [mes, setMes] = useState(() => format(new Date(), "yyyy-MM"));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "client-planilha", clientId, mes],
    queryFn: () => getClientSheet(clientId!, mes),
    enabled: !!clientId,
  });

  return (
    <Dialog open={!!clientId} onOpenChange={onOpenChange}>
      <DialogContent className="glass w-full sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold truncate">{clientName ?? "Métricas do cliente"}</h2>
            <MonthPicker value={mes} onChange={setMes} />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : isError || !data ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
              Erro ao carregar dados.
              <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
            </div>
          ) : data.columns.length === 0 ? (
            <EmptyState title="Esse cliente ainda não criou nenhuma métrica." />
          ) : (
            <div className="space-y-4">
              <MetricsLineChart sheet={data} />
              <GlassCard variant="solid" className="space-y-3">
                <h3 className="font-semibold text-sm">Planilha de métricas</h3>
                <PlanilhaView sheet={data} readOnly />
              </GlassCard>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => clientId && router.push(`/admin/clientes/${clientId}`)}
            >
              Visualização completa do cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
