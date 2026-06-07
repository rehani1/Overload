package com.rehanislam.overload.preset;

import java.time.Instant;

import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PresetDtos {

	private PresetDtos() {
	}

	public record WorkoutPresetResponse(
		String id,
		Instant createdAt,
		String title,
		WorkoutResponse workout
	) {
	}

	public record MealPresetResponse(
		String id,
		Instant createdAt,
		String foodName,
		NutritionEntryResponse entry
	) {
	}

	public record WorkoutPresetRequest(
		@NotBlank
		@Size(max = 160)
		String title,

		@NotNull
		@Valid
		WorkoutResponse workout
	) {
	}

	public record WorkoutPresetUpdateRequest(
		@Size(min = 1, max = 160)
		String title,

		@Valid
		WorkoutResponse workout
	) {
	}

	public record MealPresetRequest(
		@NotBlank
		@Size(max = 160)
		String foodName,

		@NotNull
		@Valid
		NutritionEntryResponse entry
	) {
	}

	public record MealPresetUpdateRequest(
		@Size(min = 1, max = 160)
		String foodName,

		@Valid
		NutritionEntryResponse entry
	) {
	}
}
