"use client";

import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ColumnDialog } from "./ColumnDialog";
import { cn } from "@/lib/utils";

export function DashboardActions() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["metricas"] });
    setRefreshing(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center justify-center size-9 rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
        aria-label="Atualizar dashboard"
      >
        <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
      </button>
      <ColumnDialog mode="create" />
    </div>
  );
}
