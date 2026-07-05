"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { adminClientes, getClientSheet } from "@/lib/api/admin";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminClientProfileHeader } from "@/components/admin/AdminClientProfileHeader";
import { MonthPicker } from "@/components/forms/MonthPicker";
import { PlanilhaView } from "@/components/metrics/PlanilhaView";
import { MetricsLineChart } from "@/components/metrics/MetricsLineChart";
import { ClientManageModal } from "../ClientManageModal";

interface ClientDetailViewProps {
  id: string;
}

function StagesSection({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "client", id],
    queryFn: () => adminClientes.get(id),
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!data) return null;

  return (
    <GlassCard variant="solid" className="space-y-3">
      <h2 className="font-semibold">Etapas</h2>
      {data.stages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma etapa atribuída.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.stages.map((s) => (
            <li key={s.stage_id} className="flex items-start gap-2.5 rounded-lg px-2 py-2">
              {s.done ? (
                <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                {s.title && <p className="text-sm font-medium break-all">{s.title}</p>}
                <p className={(s.title ? "text-xs text-muted-foreground" : "text-sm") + " break-all whitespace-pre-wrap"}>
                  {s.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function MetricsSection({ id }: { id: string }) {
  const [mes, setMes] = useState(() => format(new Date(), "yyyy-MM"));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "client-planilha", id, mes],
    queryFn: () => getClientSheet(id, mes),
  });

  return (
    <GlassCard variant="solid" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Planilha de métricas</h2>
        <MonthPicker value={mes} onChange={setMes} />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : isError || !data ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar planilha.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      ) : data.columns.length === 0 ? (
        <EmptyState title="Esse cliente ainda não criou nenhuma métrica." />
      ) : (
        <>
          <PlanilhaView sheet={data} readOnly />
          <MetricsLineChart sheet={data} />
        </>
      )}
    </GlassCard>
  );
}

export function ClientDetailView({ id }: ClientDetailViewProps) {
  const [editing, setEditing] = useState(false);

  const { data: client, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "client", id],
    queryFn: () => adminClientes.get(id),
  });

  const notFound = axios.isAxiosError(error) && error.response?.data?.error?.code === "CLIENT_NOT_FOUND";

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3.5" />
        Voltar
      </Link>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : isError || !client ? (
        notFound ? (
          <EmptyState title="Cliente não encontrado." description="Esse cliente pode ter sido removido." />
        ) : (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
            Erro ao carregar dados do cliente.
            <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
          </div>
        )
      ) : (
        <>
          <AdminClientProfileHeader client={client} onEdit={() => setEditing(true)} />
          <StagesSection id={id} />
          <MetricsSection id={id} />
          {editing && <ClientManageModal client={client} onClose={() => setEditing(false)} />}
        </>
      )}
    </div>
  );
}
