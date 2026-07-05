import type { Stage, StageFolder } from "@/lib/api/admin";

export interface StageGroup {
  folder: StageFolder | null;
  stages: Stage[];
}

export function groupStagesByFolder(stages: Stage[], folders: StageFolder[]): StageGroup[] {
  const sortedFolders = [...folders].sort((a, b) => a.order - b.order);
  const groups: StageGroup[] = sortedFolders.map((folder) => ({
    folder,
    stages: stages.filter((s) => s.folder_id === folder.id).sort((a, b) => a.order - b.order),
  }));
  const unfiled = stages
    .filter((s) => s.folder_id === null)
    .sort((a, b) => a.order - b.order);
  groups.push({ folder: null, stages: unfiled });
  return groups;
}
