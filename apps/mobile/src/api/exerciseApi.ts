import { apiRequest } from "@/api/client";
import type { Exercise } from "@/types/exercise";

export async function getExercises(): Promise<Exercise[]> {
  return apiRequest<Exercise[]>("/exercises");
}

export async function getExercise(id: string): Promise<Exercise> {
  return apiRequest<Exercise>(`/exercises/${id}`);
}
