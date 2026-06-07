import type { NutritionTarget } from "@/types/nutrition";

const defaultNutritionUpdatedAt = "2026-06-07T00:00:00.000Z";

export const defaultNutritionTarget: NutritionTarget = {
  id: "00000000-0000-4000-8000-000000000001",
  dailyCalories: 2435,
  proteinGrams: 180,
  carbsGrams: 260,
  fatGrams: 75,
  updatedAt: defaultNutritionUpdatedAt,
};
