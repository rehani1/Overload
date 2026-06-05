import { apiRequest } from "@/api/client";
import type { Workout } from "@/types/workout";

export type CreateWorkoutRequest = Omit<Workout, "id">;
export type UpdateWorkoutRequest = Partial<Pick<Workout, "date" | "exercises" | "notes" | "title">>;

export async function getWorkouts(): Promise<Workout[]> {
  return apiRequest<Workout[]>("/workouts");
}

export async function getWorkout(id: string): Promise<Workout> {
  return apiRequest<Workout>(`/workouts/${id}`);
}

export async function createWorkout(request: CreateWorkoutRequest): Promise<Workout> {
  return apiRequest<Workout>("/workouts", {
    body: request,
    method: "POST",
  });
}

export async function updateWorkout(
  id: string,
  request: UpdateWorkoutRequest,
): Promise<Workout> {
  return apiRequest<Workout>(`/workouts/${id}`, {
    body: request,
    method: "PATCH",
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  await apiRequest<void>(`/workouts/${id}`, {
    method: "DELETE",
  });
}
