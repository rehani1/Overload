import { apiClient } from "../lib/apiClient";
import type {
  AnalyticsSummary,
  Exercise,
  NutritionEntry,
  NutritionTarget,
  Program,
  User,
  Workout,
} from "../types/api";

export type AnalyticsRange = {
  from?: string;
  to?: string;
};

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/users/me");

  return response.data;
}

export async function getAnalyticsSummary(
  range: AnalyticsRange = {},
): Promise<AnalyticsSummary> {
  const response = await apiClient.get<AnalyticsSummary>("/analytics/summary", {
    params: range,
  });

  return response.data;
}

export async function getExercises(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>("/exercises");

  return response.data;
}

export async function getNutritionEntries(): Promise<NutritionEntry[]> {
  const response = await apiClient.get<NutritionEntry[]>("/nutrition/entries");

  return response.data;
}

export async function getNutritionTarget(): Promise<NutritionTarget> {
  const response = await apiClient.get<NutritionTarget>("/nutrition/target");

  return response.data;
}

export async function getPrograms(): Promise<Program[]> {
  const response = await apiClient.get<Program[]>("/programs");

  return response.data;
}

export async function getWorkouts(): Promise<Workout[]> {
  const response = await apiClient.get<Workout[]>("/workouts");

  return response.data;
}
