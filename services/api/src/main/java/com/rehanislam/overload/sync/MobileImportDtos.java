package com.rehanislam.overload.sync;

import java.util.List;

import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;
import com.rehanislam.overload.preset.PresetDtos.MealPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;

public final class MobileImportDtos {

	private MobileImportDtos() {
	}

	public record MobileImportRequest(
		NutritionTargetResponse nutritionTarget,
		List<NutritionEntryResponse> nutritionEntries,
		List<WorkoutResponse> workouts,
		WorkoutResponse activeWorkout,
		List<MealPresetResponse> mealPresets,
		List<WorkoutPresetResponse> workoutPresets
	) {
	}

	public record MobileImportResponse(
		int nutritionEntries,
		int workouts,
		int activeWorkouts,
		int mealPresets,
		int workoutPresets
	) {
	}
}
