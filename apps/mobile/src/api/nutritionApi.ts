import { apiRequest } from "@/api/client";
import type {
  NutritionEntry,
  NutritionEntryDraft,
  NutritionEntryUpdate,
  NutritionTarget,
  NutritionTargetUpdate,
} from "@/types/nutrition";

export type CreateNutritionEntryRequest = NutritionEntryDraft & {
  clientId?: string;
};
export type UpdateNutritionEntryRequest = NutritionEntryUpdate;
export type UpdateNutritionTargetRequest = NutritionTargetUpdate;

export async function getNutritionEntries(date?: string): Promise<NutritionEntry[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";

  return apiRequest<NutritionEntry[]>(`/nutrition/entries${query}`);
}

export async function createNutritionEntry(
  request: CreateNutritionEntryRequest,
): Promise<NutritionEntry> {
  return apiRequest<NutritionEntry>("/nutrition/entries", {
    body: request,
    method: "POST",
  });
}

export async function updateNutritionEntry(
  id: string,
  request: UpdateNutritionEntryRequest,
): Promise<NutritionEntry> {
  return apiRequest<NutritionEntry>(`/nutrition/entries/${id}`, {
    body: request,
    method: "PATCH",
  });
}

export async function deleteNutritionEntry(id: string): Promise<void> {
  await apiRequest<void>(`/nutrition/entries/${id}`, {
    method: "DELETE",
  });
}

export async function getNutritionTarget(): Promise<NutritionTarget> {
  return apiRequest<NutritionTarget>("/nutrition/target");
}

export async function updateNutritionTarget(
  request: UpdateNutritionTargetRequest,
): Promise<NutritionTarget> {
  return apiRequest<NutritionTarget>("/nutrition/target", {
    body: request,
    method: "PUT",
  });
}
