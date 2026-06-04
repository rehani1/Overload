import type { Exercise } from "./exercise";

export type WorkoutStatus = "active" | "completed";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
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
