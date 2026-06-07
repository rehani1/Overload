import { useSyncExternalStore } from "react";

import { loadAccountScopedJson, saveAccountScopedJson } from "@/lib/accountStorage";
import type { NutritionEntry } from "@/types/nutrition";
import type { MealPreset, WorkoutPreset } from "@/types/preset";
import type { Workout } from "@/types/workout";
import { createId } from "@/utils/id";
import { cloneWorkout } from "@/utils/workout";

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
let activeAccountId: string | null = null;
let activeAccountVersion = 0;

const listeners = new Set<() => void>();

function emit(nextState: PresetState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: PresetState) {
  activeAccountVersion += 1;
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

export function setPresetStoreAccount(accountId: string | null) {
  if (activeAccountId === accountId && state.isHydrated) {
    return;
  }

  activeAccountId = accountId;
  activeAccountVersion += 1;

  if (!accountId) {
    emit(createEmptyPresetState(true));
    return;
  }

  emit(createEmptyPresetState(false));
  void hydratePresetState(accountId, activeAccountVersion);
}

async function hydratePresetState(accountId: string, accountVersion: number) {
  const storedState = await loadAccountScopedJson<PresetState>(
    PRESET_STORAGE_KEY,
    accountId,
  );
  const nextState: PresetState = {
    isHydrated: true,
    mealPresets: storedState?.mealPresets ?? [],
    workoutPresets: storedState?.workoutPresets ?? [],
  };

  if (activeAccountId !== accountId || activeAccountVersion !== accountVersion) {
    return;
  }

  emit(nextState);
  void savePresetStateForAccount(accountId, nextState);
}

async function savePresetState(nextState: PresetState) {
  const accountId = activeAccountId;

  if (!accountId) {
    return;
  }

  await savePresetStateForAccount(accountId, nextState);
}

async function savePresetStateForAccount(accountId: string, nextState: PresetState) {
  await saveAccountScopedJson<PresetState>(PRESET_STORAGE_KEY, accountId, {
    isHydrated: true,
    mealPresets: nextState.mealPresets,
    workoutPresets: nextState.workoutPresets,
  });
}

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

function createEmptyPresetState(isHydrated: boolean): PresetState {
  return {
    isHydrated,
    mealPresets: [],
    workoutPresets: [],
  };
}

export function usePresetStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
