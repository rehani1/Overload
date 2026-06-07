import { useSyncExternalStore } from "react";

import { loadStoredJson, saveStoredJson } from "@/lib/storage";
import type { NutritionEntry } from "@/types/nutrition";
import type { MealPreset, WorkoutPreset } from "@/types/preset";
import type { Workout } from "@/types/workout";

const PRESET_STORAGE_KEY = "overload.presets.v1";

type PresetState = {
  isHydrated: boolean;
  mealPresets: MealPreset[];
  workoutPresets: WorkoutPreset[];
};

type PresetStore = PresetState & {
  addMealPreset: (entry: NutritionEntry) => MealPreset;
  addWorkoutPreset: (workout: Workout) => WorkoutPreset;
  deleteMealPreset: (presetId: string) => void;
  deleteWorkoutPreset: (presetId: string) => void;
  updateMealPreset: (presetId: string, entry: NutritionEntry) => MealPreset | null;
  updateWorkoutPreset: (presetId: string, workout: Workout) => WorkoutPreset | null;
};

let state: PresetState = {
  isHydrated: false,
  mealPresets: [],
  workoutPresets: [],
};

const listeners = new Set<() => void>();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emit(nextState: PresetState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: PresetState) {
  emit(nextState);
  void savePresetState(nextState);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function addMealPreset(entry: NutritionEntry) {
  const now = new Date().toISOString();
  const preset: MealPreset = {
    createdAt: now,
    entry: cloneNutritionEntry(entry),
    foodName: entry.foodName.trim() || "Meal Preset",
    id: createId("meal-preset"),
  };

  emitAndPersist({
    ...state,
    isHydrated: true,
    mealPresets: [preset, ...state.mealPresets],
  });

  return preset;
}

function addWorkoutPreset(workout: Workout) {
  const now = new Date().toISOString();
  const preset: WorkoutPreset = {
    createdAt: now,
    id: createId("workout-preset"),
    title: workout.title.trim() || "Workout Preset",
    workout: cloneWorkout(workout),
  };

  emitAndPersist({
    ...state,
    isHydrated: true,
    workoutPresets: [preset, ...state.workoutPresets],
  });

  return preset;
}

function deleteMealPreset(presetId: string) {
  emitAndPersist({
    ...state,
    isHydrated: true,
    mealPresets: state.mealPresets.filter((preset) => preset.id !== presetId),
  });
}

function deleteWorkoutPreset(presetId: string) {
  emitAndPersist({
    ...state,
    isHydrated: true,
    workoutPresets: state.workoutPresets.filter((preset) => preset.id !== presetId),
  });
}

function updateMealPreset(presetId: string, entry: NutritionEntry) {
  const existingPreset = state.mealPresets.find((preset) => preset.id === presetId);

  if (!existingPreset) {
    return null;
  }

  const updatedPreset: MealPreset = {
    ...existingPreset,
    entry: cloneNutritionEntry(entry),
    foodName: entry.foodName.trim() || "Meal Preset",
  };

  emitAndPersist({
    ...state,
    isHydrated: true,
    mealPresets: state.mealPresets.map((preset) =>
      preset.id === presetId ? updatedPreset : preset,
    ),
  });

  return updatedPreset;
}

function updateWorkoutPreset(presetId: string, workout: Workout) {
  const existingPreset = state.workoutPresets.find((preset) => preset.id === presetId);

  if (!existingPreset) {
    return null;
  }

  const updatedPreset: WorkoutPreset = {
    ...existingPreset,
    title: workout.title.trim() || "Workout Preset",
    workout: cloneWorkout(workout),
  };

  emitAndPersist({
    ...state,
    isHydrated: true,
    workoutPresets: state.workoutPresets.map((preset) =>
      preset.id === presetId ? updatedPreset : preset,
    ),
  });

  return updatedPreset;
}

function cloneNutritionEntry(entry: NutritionEntry): NutritionEntry {
  return {
    ...entry,
  };
}

function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      exercise: {
        ...workoutExercise.exercise,
      },
      sets: workoutExercise.sets.map((set) => ({
        ...set,
      })),
    })),
  };
}

async function hydratePresetState() {
  const storedState = await loadStoredJson<PresetState>(PRESET_STORAGE_KEY);

  emit({
    isHydrated: true,
    mealPresets: storedState?.mealPresets ?? [],
    workoutPresets: storedState?.workoutPresets ?? [],
  });
}

async function savePresetState(nextState: PresetState) {
  await saveStoredJson<PresetState>(PRESET_STORAGE_KEY, {
    isHydrated: true,
    mealPresets: nextState.mealPresets,
    workoutPresets: nextState.workoutPresets,
  });
}

void hydratePresetState();

function buildStore(snapshot: PresetState): PresetStore {
  return {
    ...snapshot,
    addMealPreset,
    addWorkoutPreset,
    deleteMealPreset,
    deleteWorkoutPreset,
    updateMealPreset,
    updateWorkoutPreset,
  };
}

export function usePresetStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
