export type ApiDecimal = number | string;

export type UnitPreference = "lb" | "kg";
export type Sex = "female" | "male";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  goal: string;
  heightInches: number;
  sex: Sex;
  unitPreference: UnitPreference;
  weightPounds: ApiDecimal;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  firstName: string;
  lastName: string;
  goal: string;
  heightInches: number;
  sex: Sex;
  weightPounds: number;
  unitPreference?: UnitPreference;
  nutritionTarget?: {
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
  };
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
};

export type WorkoutStatus = "active" | "completed";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  reps: number;
  weight: ApiDecimal;
  weightUnit?: UnitPreference;
  rpe?: ApiDecimal;
  isWarmup?: boolean;
};

export type WorkoutExercise = {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
};

export type Workout = {
  id: string;
  title: string;
  date: string;
  exercises: WorkoutExercise[];
  notes?: string;
  status: WorkoutStatus;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type NutritionEntry = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  servingQuantity: ApiDecimal;
  calories: number;
  proteinGrams: ApiDecimal;
  carbsGrams: ApiDecimal;
  fatGrams: ApiDecimal;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NutritionTarget = {
  id: string;
  dailyCalories: number;
  proteinGrams: ApiDecimal;
  carbsGrams: ApiDecimal;
  fatGrams: ApiDecimal;
  updatedAt: string;
};

export type Program = {
  id: string;
  name: string;
  goal: string;
  notes?: string;
  days: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsSummary = {
  dateRange: {
    from: string;
    to: string;
  };
  workoutCount: number;
  totalVolumeByUnit: Array<{
    weightUnit: UnitPreference;
    totalVolume: ApiDecimal;
  }>;
  muscleGroupVolume: Array<{
    muscleGroup: string;
    weightUnit: UnitPreference;
    totalVolume: ApiDecimal;
  }>;
  nutritionAverages: {
    loggedDays: number;
    calories: ApiDecimal;
    proteinGrams: ApiDecimal;
    carbsGrams: ApiDecimal;
    fatGrams: ApiDecimal;
  };
  targetAdherence: {
    dailyCalories: number;
    proteinGrams: ApiDecimal;
    carbsGrams: ApiDecimal;
    fatGrams: ApiDecimal;
    calorieAdherencePercent: ApiDecimal;
    proteinAdherencePercent: ApiDecimal;
    carbsAdherencePercent: ApiDecimal;
    fatAdherencePercent: ApiDecimal;
    averageCalorieDelta: ApiDecimal;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    date: string;
    title: string;
    subtitle: string;
  }>;
};
