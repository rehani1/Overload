import { useSyncExternalStore } from "react";

import { mockWorkouts } from "@/features/workouts/mockWorkouts";
import type { Workout } from "@/types/workout";

type WorkoutHistoryState = {
  workouts: Workout[];
};

type WorkoutHistoryStore = WorkoutHistoryState & {
  addCompletedWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  duplicateWorkout: (workoutId: string) => Workout | null;
  getWorkoutById: (workoutId: string) => Workout | undefined;
};

let state: WorkoutHistoryState = {
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function addCompletedWorkout(workout: Workout) {
  emit({
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
  emit({
    workouts: state.workouts.filter((workout) => workout.id !== workoutId),
  });
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

function buildStore(snapshot: WorkoutHistoryState): WorkoutHistoryStore {
  return {
    ...snapshot,
    addCompletedWorkout,
    deleteWorkout,
    duplicateWorkout,
    getWorkoutById,
  };
}

export function useWorkoutHistoryStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
