import { useSyncExternalStore } from "react";

import {
  loadAccountScopedJson,
  removeAccountScopedJson,
  saveAccountScopedJson,
} from "@/lib/accountStorage";
import type { Exercise } from "@/types/exercise";
import type { UnitPreference } from "@/types/user";
import type { Workout, WorkoutSet } from "@/types/workout";
import { createId } from "@/utils/id";
import { normalizeWorkoutSetUnits } from "@/utils/workout";

const ACTIVE_WORKOUT_STORAGE_KEY = "overload.activeWorkout.v1";

type ActiveWorkoutState = {
  isHydrated: boolean;
  activeWorkout: Workout | null;
};

type SetDraft = {
  reps?: number;
  weight?: number;
  weightUnit?: UnitPreference;
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
  updateWorkout: (updater: (workout: Workout) => Workout) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: () => Workout | null;
  resetWorkout: () => void;
};

let state: ActiveWorkoutState = {
  isHydrated: false,
  activeWorkout: null,
};
let activeAccountId: string | null = null;
let activeAccountVersion = 0;

const listeners = new Set<() => void>();

function getDefaultTitle() {
  return `Workout ${new Date().toLocaleDateString()}`;
}

function cloneWorkoutForActive(sourceWorkout: Workout): Workout {
  return normalizeWorkout({
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
  });
}

function emit(nextState: ActiveWorkoutState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: ActiveWorkoutState) {
  activeAccountVersion += 1;
  emit(nextState);
  void saveActiveWorkoutState(nextState);
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

  emitAndPersist({
    activeWorkout: normalizeWorkout(updater(state.activeWorkout)),
    isHydrated: true,
  });
}

function startWorkout(sourceWorkout?: Workout) {
  const activeWorkout = sourceWorkout
    ? sourceWorkout.status === "active"
      ? normalizeWorkout(sourceWorkout)
      : cloneWorkoutForActive(sourceWorkout)
    : {
        id: createId("workout"),
        title: getDefaultTitle(),
        date: new Date().toISOString(),
        exercises: [],
        status: "active" as const,
      };

  emitAndPersist({
    activeWorkout,
    isHydrated: true,
  });
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
        weightUnit: draft.weightUnit ?? "lb",
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
    ...normalizeWorkout(state.activeWorkout),
    title: state.activeWorkout.title.trim() || "Workout",
    status: "completed",
  };

  emitAndPersist({
    activeWorkout: null,
    isHydrated: true,
  });
  return completedWorkout;
}

function resetWorkout() {
  emitAndPersist({
    activeWorkout: null,
    isHydrated: true,
  });
}

function renumberSets(sets: WorkoutSet[]) {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
    weightUnit: set.weightUnit ?? "lb",
  }));
}

function normalizeWorkout(workout: Workout): Workout {
  return normalizeWorkoutSetUnits(workout);
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
    updateWorkout: updateActiveWorkout,
    removeSet,
    finishWorkout,
    resetWorkout,
  };
}

export function setActiveWorkoutStoreAccount(accountId: string | null) {
  if (activeAccountId === accountId && state.isHydrated) {
    return;
  }

  activeAccountId = accountId;
  activeAccountVersion += 1;

  if (!accountId) {
    emit(createEmptyActiveWorkoutState(true));
    return;
  }

  emit(createEmptyActiveWorkoutState(false));
  void hydrateActiveWorkoutState(accountId, activeAccountVersion);
}

export async function importActiveWorkoutForAccount(
  accountId: string,
  activeWorkout: Workout | null,
) {
  if (activeWorkout) {
    await saveActiveWorkoutStateForAccount(accountId, {
      activeWorkout: normalizeWorkout(activeWorkout),
      isHydrated: true,
    });
    return;
  }

  await removeAccountScopedJson(ACTIVE_WORKOUT_STORAGE_KEY, accountId);
}

async function hydrateActiveWorkoutState(accountId: string, accountVersion: number) {
  const storedState = await loadAccountScopedJson<ActiveWorkoutState>(
    ACTIVE_WORKOUT_STORAGE_KEY,
    accountId,
  );
  const nextState: ActiveWorkoutState = {
    activeWorkout: storedState?.activeWorkout
      ? normalizeWorkout(storedState.activeWorkout)
      : null,
    isHydrated: true,
  };

  if (activeAccountId !== accountId || activeAccountVersion !== accountVersion) {
    return;
  }

  emit(nextState);

  if (nextState.activeWorkout) {
    void saveActiveWorkoutStateForAccount(accountId, nextState);
  } else {
    void removeAccountScopedJson(ACTIVE_WORKOUT_STORAGE_KEY, accountId);
  }
}

async function saveActiveWorkoutState(nextState: ActiveWorkoutState) {
  const accountId = activeAccountId;

  if (!accountId) {
    return;
  }

  if (nextState.activeWorkout) {
    await saveActiveWorkoutStateForAccount(accountId, nextState);
    return;
  }

  await removeAccountScopedJson(ACTIVE_WORKOUT_STORAGE_KEY, accountId);
}

async function saveActiveWorkoutStateForAccount(
  accountId: string,
  nextState: ActiveWorkoutState,
) {
  await saveAccountScopedJson<ActiveWorkoutState>(ACTIVE_WORKOUT_STORAGE_KEY, accountId, {
    activeWorkout: nextState.activeWorkout,
    isHydrated: true,
  });
}

function createEmptyActiveWorkoutState(isHydrated: boolean): ActiveWorkoutState {
  return {
    activeWorkout: null,
    isHydrated,
  };
}

export function useActiveWorkoutStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}
