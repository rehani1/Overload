import { apiClient } from "../lib/apiClient";
import type {
  AnalyticsSummary,
  AiChatRequest,
  AiChatResponse,
  MealPreset,
  NutritionEntry,
  NutritionTarget,
  User,
  Workout,
  WorkoutPreset,
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

export async function getNutritionEntries(): Promise<NutritionEntry[]> {
  const response = await apiClient.get<NutritionEntry[]>("/nutrition/entries");

  return response.data;
}

export async function getNutritionTarget(): Promise<NutritionTarget> {
  const response = await apiClient.get<NutritionTarget>("/nutrition/target");

  return response.data;
}

export async function getMealPresets(): Promise<MealPreset[]> {
  const response = await apiClient.get<MealPreset[]>("/presets/meals");

  return response.data;
}

export async function getWorkoutPresets(): Promise<WorkoutPreset[]> {
  const response = await apiClient.get<WorkoutPreset[]>("/presets/workouts");

  return response.data;
}

export async function getWorkouts(): Promise<Workout[]> {
  const response = await apiClient.get<Workout[]>("/workouts");

  return response.data;
}

export async function sendAiChat(request: AiChatRequest): Promise<AiChatResponse> {
  const response = await apiClient.post<AiChatResponse>("/ai/chat", request);

  return response.data;
}
