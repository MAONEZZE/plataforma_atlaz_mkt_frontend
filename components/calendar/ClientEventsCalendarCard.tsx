"use client";

import { useQuery } from "@tanstack/react-query";
import { adminClientes } from "@/lib/api/admin";
import { groupByDate } from "@/lib/utils/calendar";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthCarousel } from "@/components/calendar/MonthCarousel";

interface ClientEventsCalendarCardProps {
  clientId: string;
}

export function ClientEventsCalendarCard({ clientId }: ClientEventsCalendarCardProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "client", clientId],
    queryFn: () => adminClientes.get(clientId),
  });

  return (
    <GlassCard variant="solid" className="space-y-3">
      <h2 className="font-semibold">Datas do cliente</h2>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : isError || !data ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar datas.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      ) : data.events.length === 0 ? (
        <EmptyState title="Nenhuma data cadastrada para esse cliente." />
      ) : (
        <MonthCarousel events={groupByDate(data.events)} />
      )}
    </GlassCard>
  );
}
