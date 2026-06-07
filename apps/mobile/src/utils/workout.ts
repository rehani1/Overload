import type { UnitPreference } from "@/types/user";
import type { Workout } from "@/types/workout";

export function cloneWorkout(workout: Workout): Workout {
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

export function normalizeWorkoutSetUnits(
  workout: Workout,
  fallbackUnit: UnitPreference = "lb",
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      sets: workoutExercise.sets.map((set) => ({
        ...set,
        weightUnit: set.weightUnit ?? fallbackUnit,
      })),
    })),
  };
}
