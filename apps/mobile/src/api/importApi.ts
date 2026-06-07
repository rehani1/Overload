import { apiRequest } from "@/api/client";
import type { NutritionEntry, NutritionTarget } from "@/types/nutrition";
import type { MealPreset, WorkoutPreset } from "@/types/preset";
import type { Workout } from "@/types/workout";

export type MobileImportRequest = {
  activeWorkout?: Workout | null;
  mealPresets: MealPreset[];
  nutritionEntries: NutritionEntry[];
  nutritionTarget: NutritionTarget;
  workoutPresets: WorkoutPreset[];
  workouts: Workout[];
};

export type MobileImportResponse = {
  activeWorkouts: number;
  mealPresets: number;
  nutritionEntries: number;
  workoutPresets: number;
  workouts: number;
};

export async function importMobileData(request: MobileImportRequest): Promise<MobileImportResponse> {
  return apiRequest<MobileImportResponse>("/import/mobile", {
    body: request,
    method: "POST",
  });
}
