export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type NutritionEntry = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  servingQuantity: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NutritionTarget = {
  id: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  updatedAt: string;
};

export type NutritionEntryDraft = Omit<NutritionEntry, "id" | "createdAt" | "updatedAt">;

export type NutritionEntryUpdate = Partial<
  Pick<
    NutritionEntry,
    | "calories"
    | "carbsGrams"
    | "date"
    | "fatGrams"
    | "foodName"
    | "mealType"
    | "notes"
    | "proteinGrams"
    | "servingQuantity"
  >
>;

export type NutritionTargetUpdate = Partial<
  Pick<NutritionTarget, "carbsGrams" | "dailyCalories" | "fatGrams" | "proteinGrams">
>;
