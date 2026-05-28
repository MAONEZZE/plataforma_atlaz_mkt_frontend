import { api } from "./client";

export interface UserStage {
  user_id: string;
  stage_id: string;
  done: boolean;
  updated_at: string;
}

export async function getMyStages(): Promise<UserStage[]> {
  const { data } = await api.get<UserStage[]>("/stages/me");
  return data;
}

export async function updateMyStage(stage_id: string, done: boolean): Promise<UserStage> {
  const { data } = await api.patch<UserStage>(`/stages/me/${stage_id}`, { done });
  return data;
}
