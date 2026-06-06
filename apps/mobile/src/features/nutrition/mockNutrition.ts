import type { NutritionEntry, NutritionTarget } from "@/types/nutrition";

const now = new Date().toISOString();
const today = now.slice(0, 10);

export const mockNutritionTarget: NutritionTarget = {
  id: "00000000-0000-4000-8000-000000000001",
  dailyCalories: 2400,
  proteinGrams: 180,
  carbsGrams: 260,
  fatGrams: 75,
  updatedAt: now,
};

export const mockNutritionEntries: NutritionEntry[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    date: today,
    mealType: "breakfast",
    foodName: "Greek yogurt bowl",
    servingQuantity: 1,
    calories: 430,
    proteinGrams: 38,
    carbsGrams: 48,
    fatGrams: 10,
    notes: "Seed entry for local nutrition tracking.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    date: today,
    mealType: "lunch",
    foodName: "Chicken rice bowl",
    servingQuantity: 1,
    calories: 710,
    proteinGrams: 55,
    carbsGrams: 82,
    fatGrams: 18,
    createdAt: now,
    updatedAt: now,
  },
];
