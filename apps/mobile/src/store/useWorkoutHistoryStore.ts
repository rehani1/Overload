import { useSyncExternalStore } from "react";

import { mockWorkouts } from "@/features/workouts/mockWorkouts";
import { loadStoredJson, saveStoredJson } from "@/lib/storage";
import type { Workout } from "@/types/workout";

const WORKOUT_HISTORY_STORAGE_KEY = "overload.workoutHistory.v1";

type WorkoutHistoryState = {
  isHydrated: boolean;
  workouts: Workout[];
};

type WorkoutHistoryStore = WorkoutHistoryState & {
  addCompletedWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  duplicateWorkout: (workoutId: string) => Workout | null;
  getWorkoutById: (workoutId: string) => Workout | undefined;
  updateWorkout: (workoutId: string, updates: WorkoutHistoryUpdate) => Workout | null;
};

type WorkoutHistoryUpdate = Partial<Pick<Workout, "date" | "notes" | "title">>;

let state: WorkoutHistoryState = {
  isHydrated: false,
  workouts: mockWorkouts,
};

const listeners = new Set<() => void>();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emit(nextState: WorkoutHistoryState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: WorkoutHistoryState) {
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
        ...workout,
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

function updateWorkout(workoutId: string, updates: WorkoutHistoryUpdate) {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return null;
  }

  const updatedWorkout: Workout = {
    ...workout,
    ...updates,
  };

  emitAndPersist({
    isHydrated: true,
    workouts: state.workouts.map((currentWorkout) =>
      currentWorkout.id === workoutId ? updatedWorkout : currentWorkout,
    ),
  });

  return updatedWorkout;
}

function duplicateWorkout(workoutId: string): Workout | null {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return null;
  }

  return {
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
  };
}

function getWorkoutById(workoutId: string) {
  return state.workouts.find((workout) => workout.id === workoutId);
}

async function hydrateWorkoutHistoryState() {
  const storedState = await loadStoredJson<WorkoutHistoryState>(WORKOUT_HISTORY_STORAGE_KEY);

  emit({
    isHydrated: true,
    workouts: storedState?.workouts ?? mockWorkouts,
  });
}

async function saveWorkoutHistoryState(nextState: WorkoutHistoryState) {
  await saveStoredJson<WorkoutHistoryState>(WORKOUT_HISTORY_STORAGE_KEY, {
    isHydrated: true,
    workouts: nextState.workouts,
  });
}

void hydrateWorkoutHistoryState();

function buildStore(snapshot: WorkoutHistoryState): WorkoutHistoryStore {
  return {
    ...snapshot,
    addCompletedWorkout,
    deleteWorkout,
    duplicateWorkout,
    getWorkoutById,
    updateWorkout,
  };
}

export function useWorkoutHistoryStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
