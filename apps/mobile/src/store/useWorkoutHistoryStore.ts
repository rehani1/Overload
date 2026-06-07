import { useSyncExternalStore } from "react";

import { loadAccountScopedJson, saveAccountScopedJson } from "@/lib/accountStorage";
import type { Workout } from "@/types/workout";
import { createId } from "@/utils/id";
import { normalizeWorkoutSetUnits } from "@/utils/workout";

const WORKOUT_HISTORY_STORAGE_KEY = "overload.workoutHistory.v1";
const REMOVED_SEED_WORKOUT_IDS = new Set([
  "workout-upper-strength-1",
  "workout-lower-volume-1",
  "workout-push-pull-1",
]);

type WorkoutHistoryState = {
  isHydrated: boolean;
  workouts: Workout[];
};

type WorkoutHistoryStore = WorkoutHistoryState & {
  addCompletedWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  duplicateWorkout: (workoutId: string) => Workout | null;
  getWorkoutById: (workoutId: string) => Workout | undefined;
  restoreWorkout: (workout: Workout) => void;
  updateWorkout: (workoutId: string, updates: WorkoutHistoryUpdate) => Workout | null;
};

type WorkoutHistoryUpdate = Partial<Pick<Workout, "date" | "exercises" | "notes" | "title">>;

let state: WorkoutHistoryState = {
  isHydrated: false,
  workouts: [],
};
let activeAccountId: string | null = null;
let activeAccountVersion = 0;

const listeners = new Set<() => void>();

function emit(nextState: WorkoutHistoryState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: WorkoutHistoryState) {
  activeAccountVersion += 1;
  emit(nextState);
  void saveWorkoutHistoryState(nextState);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function addCompletedWorkout(workout: Workout) {
  emitAndPersist({
    isHydrated: true,
    workouts: [
      {
        ...normalizeWorkout(workout),
        status: "completed",
      },
      ...state.workouts,
    ],
  });
}

function deleteWorkout(workoutId: string) {
  emitAndPersist({
    isHydrated: true,
    workouts: state.workouts.filter((workout) => workout.id !== workoutId),
  });
}

function restoreWorkout(workout: Workout) {
  const existingWorkout = getWorkoutById(workout.id);

  emitAndPersist({
    isHydrated: true,
    workouts: existingWorkout
      ? state.workouts.map((currentWorkout) =>
          currentWorkout.id === workout.id ? normalizeWorkout(workout) : currentWorkout,
        )
      : [normalizeWorkout(workout), ...state.workouts],
  });
}

function updateWorkout(workoutId: string, updates: WorkoutHistoryUpdate) {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return null;
  }

  const updatedWorkout: Workout = {
    ...workout,
    ...updates,
  };
  const normalizedWorkout = normalizeWorkout(updatedWorkout);

  emitAndPersist({
    isHydrated: true,
    workouts: state.workouts.map((currentWorkout) =>
      currentWorkout.id === workoutId ? normalizedWorkout : currentWorkout,
    ),
  });

  return normalizedWorkout;
}

function duplicateWorkout(workoutId: string): Workout | null {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return null;
  }

  return normalizeWorkout({
    ...workout,
    id: createId("workout"),
    title: `${workout.title} Copy`,
    date: new Date().toISOString(),
    status: "active" as const,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      id: createId("workout-exercise"),
      sets: workoutExercise.sets.map((set, index) => ({
        ...set,
        id: createId("set"),
        setNumber: index + 1,
      })),
    })),
  });
}

function getWorkoutById(workoutId: string) {
  return state.workouts.find((workout) => workout.id === workoutId);
}

export function setWorkoutHistoryStoreAccount(accountId: string | null) {
  if (activeAccountId === accountId && state.isHydrated) {
    return;
  }

  activeAccountId = accountId;
  activeAccountVersion += 1;

  if (!accountId) {
    emit(createEmptyWorkoutHistoryState(true));
    return;
  }

  emit(createEmptyWorkoutHistoryState(false));
  void hydrateWorkoutHistoryState(accountId, activeAccountVersion);
}

export async function importWorkoutHistoryForAccount(accountId: string, workouts: Workout[]) {
  await saveWorkoutHistoryStateForAccount(accountId, {
    isHydrated: true,
    workouts: normalizeStoredWorkouts(workouts),
  });
}

async function hydrateWorkoutHistoryState(accountId: string, accountVersion: number) {
  const storedState = await loadAccountScopedJson<WorkoutHistoryState>(
    WORKOUT_HISTORY_STORAGE_KEY,
    accountId,
  );
  const nextState: WorkoutHistoryState = {
    isHydrated: true,
    workouts: normalizeStoredWorkouts(storedState?.workouts),
  };

  if (activeAccountId !== accountId || activeAccountVersion !== accountVersion) {
    return;
  }

  emit(nextState);
  void saveWorkoutHistoryStateForAccount(accountId, nextState);
}

async function saveWorkoutHistoryState(nextState: WorkoutHistoryState) {
  const accountId = activeAccountId;

  if (!accountId) {
    return;
  }

  await saveWorkoutHistoryStateForAccount(accountId, nextState);
}

async function saveWorkoutHistoryStateForAccount(
  accountId: string,
  nextState: WorkoutHistoryState,
) {
  await saveAccountScopedJson<WorkoutHistoryState>(WORKOUT_HISTORY_STORAGE_KEY, accountId, {
    isHydrated: true,
    workouts: nextState.workouts,
  });
}

function normalizeWorkout(workout: Workout): Workout {
  return normalizeWorkoutSetUnits(workout);
}

function normalizeStoredWorkouts(workouts: Workout[] | undefined) {
  return (workouts ?? []).filter(isUserWorkout).map(normalizeWorkout);
}

function isUserWorkout(workout: Workout) {
  return !REMOVED_SEED_WORKOUT_IDS.has(workout.id);
}

function buildStore(snapshot: WorkoutHistoryState): WorkoutHistoryStore {
  return {
    ...snapshot,
    addCompletedWorkout,
    deleteWorkout,
    duplicateWorkout,
    getWorkoutById,
    restoreWorkout,
    updateWorkout,
  };
}

function createEmptyWorkoutHistoryState(isHydrated: boolean): WorkoutHistoryState {
  return {
    isHydrated,
    workouts: [],
  };
}

export function useWorkoutHistoryStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
