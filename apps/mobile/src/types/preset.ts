import type { NutritionEntry } from "./nutrition";
import type { Workout } from "./workout";

export type WorkoutPreset = {
  id: string;
  createdAt: string;
  title: string;
  workout: Workout;
};

export type MealPreset = {
  id: string;
  createdAt: string;
  foodName: string;
  entry: NutritionEntry;
};
