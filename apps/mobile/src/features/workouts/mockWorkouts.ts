import { mockExercises } from "@/features/exercises/mockExercises";
import type { Workout } from "@/types/workout";

const benchPress = mockExercises[0];
const squat = mockExercises[1];
const deadlift = mockExercises[2];
const overheadPress = mockExercises[3];
const pullUp = mockExercises[4];
const barbellRow = mockExercises[5];
const inclineDumbbellPress = mockExercises[7];
const romanianDeadlift = mockExercises[9];

export const mockWorkouts: Workout[] = [
  {
    id: "workout-upper-strength-1",
    title: "Upper Strength",
    date: "2026-06-03T18:30:00.000Z",
    status: "completed",
    notes: "Bench moved well. Keep rows strict next time.",
    exercises: [
      {
        id: "workout-exercise-bench-1",
        exercise: benchPress,
        sets: [
          { id: "set-bench-1", setNumber: 1, reps: 5, weight: 185, rpe: 7 },
          { id: "set-bench-2", setNumber: 2, reps: 5, weight: 195, rpe: 8 },
          { id: "set-bench-3", setNumber: 3, reps: 4, weight: 205, rpe: 8.5 },
        ],
      },
      {
        id: "workout-exercise-row-1",
        exercise: barbellRow,
        sets: [
          { id: "set-row-1", setNumber: 1, reps: 8, weight: 135, rpe: 7 },
          { id: "set-row-2", setNumber: 2, reps: 8, weight: 145, rpe: 8 },
          { id: "set-row-3", setNumber: 3, reps: 8, weight: 145, rpe: 8 },
        ],
      },
      {
        id: "workout-exercise-press-1",
        exercise: overheadPress,
        sets: [
          { id: "set-press-1", setNumber: 1, reps: 6, weight: 95, rpe: 7 },
          { id: "set-press-2", setNumber: 2, reps: 6, weight: 100, rpe: 8 },
        ],
      },
    ],
  },
  {
    id: "workout-lower-volume-1",
    title: "Lower Volume",
    date: "2026-06-01T17:45:00.000Z",
    status: "completed",
    exercises: [
      {
        id: "workout-exercise-squat-1",
        exercise: squat,
        sets: [
          { id: "set-squat-1", setNumber: 1, reps: 5, weight: 225, rpe: 7 },
          { id: "set-squat-2", setNumber: 2, reps: 5, weight: 245, rpe: 8 },
          { id: "set-squat-3", setNumber: 3, reps: 5, weight: 245, rpe: 8 },
        ],
      },
      {
        id: "workout-exercise-rdl-1",
        exercise: romanianDeadlift,
        sets: [
          { id: "set-rdl-1", setNumber: 1, reps: 8, weight: 185, rpe: 7 },
          { id: "set-rdl-2", setNumber: 2, reps: 8, weight: 195, rpe: 8 },
          { id: "set-rdl-3", setNumber: 3, reps: 8, weight: 195, rpe: 8 },
        ],
      },
    ],
  },
  {
    id: "workout-push-pull-1",
    title: "Push Pull Accessories",
    date: "2026-05-29T19:00:00.000Z",
    status: "completed",
    notes: "Kept this shorter after a busy day.",
    exercises: [
      {
        id: "workout-exercise-incline-1",
        exercise: inclineDumbbellPress,
        sets: [
          { id: "set-incline-1", setNumber: 1, reps: 10, weight: 60, rpe: 7 },
          { id: "set-incline-2", setNumber: 2, reps: 9, weight: 65, rpe: 8 },
          { id: "set-incline-3", setNumber: 3, reps: 8, weight: 65, rpe: 8.5 },
        ],
      },
      {
        id: "workout-exercise-pull-up-1",
        exercise: pullUp,
        sets: [
          { id: "set-pullup-1", setNumber: 1, reps: 8, weight: 0, rpe: 7 },
          { id: "set-pullup-2", setNumber: 2, reps: 7, weight: 0, rpe: 8 },
          { id: "set-pullup-3", setNumber: 3, reps: 6, weight: 0, rpe: 8 },
        ],
      },
      {
        id: "workout-exercise-deadlift-1",
        exercise: deadlift,
        sets: [
          { id: "set-deadlift-1", setNumber: 1, reps: 3, weight: 315, rpe: 7.5 },
          { id: "set-deadlift-2", setNumber: 2, reps: 3, weight: 335, rpe: 8 },
        ],
      },
    ],
  },
];
