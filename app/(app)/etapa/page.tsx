"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getMyStages, updateMyStage } from "@/lib/api/etapas";
import { adminStages } from "@/lib/api/admin";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StageWithText {
  stage_id: string;
  text: string;
  stage_title: string | null;
  done: boolean;
}

export default function EtapaPage() {
  const [localStages, setLocalStages] = useState<StageWithText[]>([]);
  const [originalDone, setOriginalDone] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: myStages, isLoading: loadingMine } = useQuery({
    queryKey: ["stages", "me"],
    queryFn: getMyStages,
  });

  const { data: allStages, isLoading: loadingAll } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });

  useEffect(() => {
    if (!myStages || !allStages) return;
    const merged: StageWithText[] = myStages.map((s) => {
      const def = allStages.find((a) => a.id === s.stage_id);
      return {
        stage_id: s.stage_id,
        text: def?.text ?? "Etapa sem título",
        stage_title: def?.stage_title ?? null,
        done: s.done,
      };
    });
    setLocalStages(merged);
    const original: Record<string, boolean> = {};
    myStages.forEach((s) => {
      original[s.stage_id] = s.done;
    });
    setOriginalDone(original);
  }, [myStages, allStages]);

  async function handleSave() {
    setSaving(true);
    const changed = localStages.filter(
      (s) => s.done !== originalDone[s.stage_id],
    );
    try {
      await Promise.all(changed.map((s) => updateMyStage(s.stage_id, s.done)));
      const newOriginal = { ...originalDone };
      changed.forEach((s) => {
        newOriginal[s.stage_id] = s.done;
      });
      setOriginalDone(newOriginal);
      toast.success("Etapas salvas!");
    } catch {
      toast.error("Erro ao salvar etapas.");
    } finally {
      setSaving(false);
    }
  }

  const isLoading = loadingMine || loadingAll;
  const hasChanges = localStages.some(
    (s) => s.done !== originalDone[s.stage_id],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Etapas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe seu progresso.
          </p>
        </div>
        {!isLoading && localStages.length > 0 && (
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : localStages.length === 0 ? (
        <GlassCard variant="soft" className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa atribuída ainda.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localStages.map((stage) => (
            <GlassCard key={stage.stage_id} variant="solid" className="p-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage.done}
                  onChange={(e) =>
                    setLocalStages((prev) =>
                      prev.map((s) =>
                        s.stage_id === stage.stage_id
                          ? { ...s, done: e.target.checked }
                          : s,
                      ),
                    )
                  }
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
                />
                <div className="min-w-0 flex-1">
                  {stage.stage_title && (
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug break-all",
                        stage.done && "line-through text-muted-foreground",
                      )}
                    >
                      {stage.stage_title}
                    </p>
                  )}
                  <p
                    className={cn(
                      "leading-snug break-all whitespace-pre-wrap",
                      stage.stage_title ? "text-xs text-muted-foreground" : "text-sm",
                      stage.done && "line-through text-muted-foreground",
                    )}
                  >
                    {stage.text}
                  </p>
                </div>
              </label>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
