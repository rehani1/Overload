import { useSyncExternalStore } from "react";

import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutSet } from "@/types/workout";

type ActiveWorkoutState = {
  activeWorkout: Workout | null;
};

type SetDraft = {
  reps?: number;
  weight?: number;
  rpe?: number;
  isWarmup?: boolean;
};

type ActiveWorkoutStore = ActiveWorkoutState & {
  startWorkout: (sourceWorkout?: Workout) => Workout;
  setWorkoutTitle: (title: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, draft?: SetDraft) => void;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    updates: Partial<Omit<WorkoutSet, "id">>,
  ) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: () => Workout | null;
  resetWorkout: () => void;
};

let state: ActiveWorkoutState = {
  activeWorkout: null,
};

const listeners = new Set<() => void>();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultTitle() {
  return `Workout ${new Date().toLocaleDateString()}`;
}

function cloneWorkoutForActive(sourceWorkout: Workout): Workout {
  return {
    ...sourceWorkout,
    id: createId("workout"),
    title: `${sourceWorkout.title} Copy`,
    date: new Date().toISOString(),
    status: "active",
    exercises: sourceWorkout.exercises.map((workoutExercise) => ({
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

function emit(nextState: ActiveWorkoutState) {
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

function updateActiveWorkout(updater: (workout: Workout) => Workout) {
  if (!state.activeWorkout) {
    return;
  }

  emit({ activeWorkout: updater(state.activeWorkout) });
}

function startWorkout(sourceWorkout?: Workout) {
  const activeWorkout = sourceWorkout
    ? sourceWorkout.status === "active"
      ? sourceWorkout
      : cloneWorkoutForActive(sourceWorkout)
    : {
        id: createId("workout"),
        title: getDefaultTitle(),
        date: new Date().toISOString(),
        exercises: [],
        status: "active" as const,
      };

  emit({ activeWorkout });
  return activeWorkout;
}

function setWorkoutTitle(title: string) {
  updateActiveWorkout((workout) => ({
    ...workout,
    title,
  }));
}

function addExercise(exercise: Exercise) {
  updateActiveWorkout((workout) => ({
    ...workout,
    exercises: [
      ...workout.exercises,
      {
        id: createId("workout-exercise"),
        exercise,
        sets: [],
      },
    ],
  }));
}

function removeExercise(workoutExerciseId: string) {
  updateActiveWorkout((workout) => ({
    ...workout,
    exercises: workout.exercises.filter(
      (workoutExercise) => workoutExercise.id !== workoutExerciseId,
    ),
  }));
}

function addSet(workoutExerciseId: string, draft: SetDraft = {}) {
  updateActiveWorkout((workout) => ({
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => {
      if (workoutExercise.id !== workoutExerciseId) {
        return workoutExercise;
      }

      const nextSetNumber = workoutExercise.sets.length + 1;
      const nextSet: WorkoutSet = {
        id: createId("set"),
        setNumber: nextSetNumber,
        reps: draft.reps ?? 0,
        weight: draft.weight ?? 0,
        rpe: draft.rpe,
        isWarmup: draft.isWarmup,
      };

      return {
        ...workoutExercise,
        sets: [...workoutExercise.sets, nextSet],
      };
    }),
  }));
}

function updateSet(
  workoutExerciseId: string,
  setId: string,
  updates: Partial<Omit<WorkoutSet, "id">>,
) {
  updateActiveWorkout((workout) => ({
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => {
      if (workoutExercise.id !== workoutExerciseId) {
        return workoutExercise;
      }

      return {
        ...workoutExercise,
        sets: workoutExercise.sets.map((set) =>
          set.id === setId
            ? {
                ...set,
                ...updates,
              }
            : set,
        ),
      };
    }),
  }));
}

function removeSet(workoutExerciseId: string, setId: string) {
  updateActiveWorkout((workout) => ({
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => {
      if (workoutExercise.id !== workoutExerciseId) {
        return workoutExercise;
      }

      const remainingSets = workoutExercise.sets.filter((set) => set.id !== setId);

      return {
        ...workoutExercise,
        sets: renumberSets(remainingSets),
      };
    }),
  }));
}

function finishWorkout() {
  if (!state.activeWorkout) {
    return null;
  }

  const completedWorkout: Workout = {
    ...state.activeWorkout,
    date: new Date().toISOString(),
    status: "completed",
  };

  emit({ activeWorkout: null });
  return completedWorkout;
}

function resetWorkout() {
  emit({ activeWorkout: null });
}

function renumberSets(sets: WorkoutSet[]) {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }));
}

function buildStore(snapshot: ActiveWorkoutState): ActiveWorkoutStore {
  return {
    ...snapshot,
    startWorkout,
    setWorkoutTitle,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    finishWorkout,
    resetWorkout,
  };
}

export function useActiveWorkoutStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
