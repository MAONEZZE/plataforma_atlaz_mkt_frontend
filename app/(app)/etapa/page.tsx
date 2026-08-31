"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyStages, updateMyStage } from "@/lib/api/etapas";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StageWithText {
  stage_id: string;
  text: string | null;
  title: string | null;
  done: boolean;
  folder_id: string | null;
  folder_title: string | null;
  order: number;
}

interface StageGroup {
  folderId: string | null;
  folderTitle: string | null;
  stages: StageWithText[];
}

function groupByFolder(stages: StageWithText[]): StageGroup[] {
  const map = new Map<string, StageGroup>();
  for (const s of stages) {
    const key = s.folder_id ?? "unfiled";
    if (!map.has(key)) map.set(key, { folderId: s.folder_id, folderTitle: s.folder_title, stages: [] });
    map.get(key)!.stages.push(s);
  }
  const unfiled = map.get("unfiled");
  const named = [...map.entries()]
    .filter(([key]) => key !== "unfiled")
    .map(([, g]) => g)
    .sort((a, b) => (a.folderTitle ?? "").localeCompare(b.folderTitle ?? ""));
  for (const g of named) g.stages.sort((a, b) => a.order - b.order);
  if (unfiled) {
    unfiled.stages.sort((a, b) => a.order - b.order);
    return [...named, unfiled];
  }
  return named;
}

export default function EtapaPage() {
  const [localStages, setLocalStages] = useState<StageWithText[]>([]);
  const [originalDone, setOriginalDone] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: myStages, isLoading } = useQuery({
    queryKey: ["stages", "me"],
    queryFn: getMyStages,
  });

  useEffect(() => {
    if (!myStages) return;
    setLocalStages(
      myStages.map((s) => ({
        stage_id: s.stage_id,
        text: s.text,
        title: s.title,
        done: s.done,
        folder_id: s.folder_id,
        folder_title: s.folder_title,
        order: s.order,
      })),
    );
    const original: Record<string, boolean> = {};
    myStages.forEach((s) => {
      original[s.stage_id] = s.done;
    });
    setOriginalDone(original);
  }, [myStages]);

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
  const hasChanges = localStages.some(
    (s) => s.done !== originalDone[s.stage_id],
  );

  function toggleStage(stageId: string, done: boolean) {
    setLocalStages((prev) =>
      prev.map((s) => (s.stage_id === stageId ? { ...s, done } : s)),
    );
  }

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  function toggleFolderExpand(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const groups = useMemo(() => groupByFolder(localStages), [localStages]);
  const showFolderHeadings = groups.length > 1 || groups.some((g) => g.folderTitle !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Etapas</h1>
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
        <div className="space-y-4">
          {groups.map((group, i) =>
            group.folderId ? (
              <FolderDropdown
                key={group.folderId}
                title={group.folderTitle ?? ""}
                stages={group.stages}
                isExpanded={expandedFolders.has(group.folderId)}
                onToggle={() => toggleFolderExpand(group.folderId!)}
                onToggleStage={toggleStage}
              />
            ) : (
              <div key={`unfiled-${i}`} className="space-y-3">
                {showFolderHeadings && (
                  <h2 className="text-sm font-medium text-muted-foreground">Sem pasta</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.stages.map((stage) => (
                    <StageCard key={stage.stage_id} stage={stage} onToggle={toggleStage} />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function FolderDropdown({
  title,
  stages,
  isExpanded,
  onToggle,
  onToggleStage,
}: {
  title: string;
  stages: StageWithText[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleStage: (stageId: string, done: boolean) => void;
}) {
  return (
    <GlassCard variant="solid" className="p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex items-center gap-1.5 w-full text-left cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium flex-1 truncate">{title}</span>
        <span className="text-xs text-muted-foreground">{stages.length} etapas</span>
      </button>
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
          {stages.map((stage) => (
            <StageCard key={stage.stage_id} stage={stage} onToggle={onToggleStage} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function StageCard({
  stage,
  onToggle,
}: {
  stage: StageWithText;
  onToggle: (stageId: string, done: boolean) => void;
}) {
  return (
    <GlassCard variant="solid" className="p-4">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={stage.done}
          onChange={(e) => onToggle(stage.stage_id, e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
        />
        <div className="min-w-0 flex-1">
          {stage.title && (
            <p
              className={cn(
                "text-sm font-medium leading-snug break-all",
                stage.done && "line-through text-muted-foreground",
              )}
            >
              {stage.title}
            </p>
          )}
          {stage.text && (
            <p
              className={cn(
                "leading-snug break-all whitespace-pre-wrap",
                stage.title ? "text-xs text-muted-foreground" : "text-sm",
                stage.done && "line-through text-muted-foreground",
              )}
            >
              {stage.text}
            </p>
          )}
        </div>
      </label>
    </GlassCard>
  );
}
