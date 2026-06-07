package com.rehanislam.overload.sync;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.nutrition.NutritionDtos.CreateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionTargetRequest;
import com.rehanislam.overload.nutrition.NutritionService;
import com.rehanislam.overload.preset.PresetDtos.MealPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetResponse;
import com.rehanislam.overload.preset.PresetService;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportRequest;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;
import com.rehanislam.overload.workout.WorkoutService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MobileImportService {

	private final NutritionService nutritionService;
	private final PresetService presetService;
	private final WorkoutService workoutService;

	public MobileImportService(
		NutritionService nutritionService,
		PresetService presetService,
		WorkoutService workoutService
	) {
		this.nutritionService = nutritionService;
		this.presetService = presetService;
		this.workoutService = workoutService;
	}

	@Transactional
	public MobileImportResponse importMobileData(UUID userId, MobileImportRequest request) {
		NutritionTargetResponse target = request.nutritionTarget();
		if (target != null) {
			nutritionService.updateTarget(userId, new UpdateNutritionTargetRequest(
				target.dailyCalories(),
				target.proteinGrams(),
				target.carbsGrams(),
				target.fatGrams()
			));
		}

		int nutritionEntryCount = importNutritionEntries(userId, safeList(request.nutritionEntries()));
		int workoutCount = importWorkouts(userId, safeList(request.workouts()));
		int activeWorkoutCount = importActiveWorkout(userId, request.activeWorkout());
		int mealPresetCount = importMealPresets(userId, safeList(request.mealPresets()));
		int workoutPresetCount = importWorkoutPresets(userId, safeList(request.workoutPresets()));

		return new MobileImportResponse(
			nutritionEntryCount,
			workoutCount,
			activeWorkoutCount,
			mealPresetCount,
			workoutPresetCount
		);
	}

	private int importNutritionEntries(UUID userId, List<NutritionEntryResponse> entries) {
		for (NutritionEntryResponse entry : entries) {
			nutritionService.createEntry(userId, new CreateNutritionEntryRequest(
				entry.date(),
				entry.mealType(),
				entry.foodName(),
				entry.servingQuantity(),
				entry.calories(),
				entry.proteinGrams(),
				entry.carbsGrams(),
				entry.fatGrams(),
				entry.notes(),
				toClientUuid("nutrition-entry", entry.id()).toString()
			));
		}
		return entries.size();
	}

	private int importWorkouts(UUID userId, List<WorkoutResponse> workouts) {
		for (WorkoutResponse workout : workouts) {
			workoutService.importWorkout(userId, workout);
		}
		return workouts.size();
	}

	private int importActiveWorkout(UUID userId, WorkoutResponse activeWorkout) {
		if (activeWorkout == null) {
			return 0;
		}
		workoutService.importWorkout(userId, new WorkoutResponse(
			activeWorkout.id(),
			activeWorkout.title(),
			activeWorkout.date(),
			activeWorkout.exercises(),
			activeWorkout.notes(),
			"active"
		));
		return 1;
	}

	private int importMealPresets(UUID userId, List<MealPresetResponse> presets) {
		for (MealPresetResponse preset : presets) {
			presetService.importMealPreset(userId, preset);
		}
		return presets.size();
	}

	private int importWorkoutPresets(UUID userId, List<WorkoutPresetResponse> presets) {
		for (WorkoutPresetResponse preset : presets) {
			presetService.importWorkoutPreset(userId, preset);
		}
		return presets.size();
	}

	private <T> List<T> safeList(List<T> values) {
		return values == null ? List.of() : values;
	}

	private UUID toClientUuid(String namespace, String id) {
		if (id != null && !id.isBlank()) {
			try {
				return UUID.fromString(id.trim());
			} catch (IllegalArgumentException ex) {
				return UUID.nameUUIDFromBytes((namespace + ":" + id.trim()).getBytes(StandardCharsets.UTF_8));
			}
		}
		return UUID.randomUUID();
	}
}
