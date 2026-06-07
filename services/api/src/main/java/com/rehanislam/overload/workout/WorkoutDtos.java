package com.rehanislam.overload.workout;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class WorkoutDtos {

	private WorkoutDtos() {
	}

	public record WorkoutResponse(
		String id,
		String title,
		String date,
		List<WorkoutExerciseResponse> exercises,
		String notes,
		String status
	) {
	}

	public record ExerciseSnapshot(
		String id,
		String name,
		String muscleGroup,
		String equipment,
		boolean isCustom
	) {
	}

	public record WorkoutExerciseResponse(
		String id,
		ExerciseSnapshot exercise,
		List<WorkoutSetResponse> sets,
		String notes
	) {
	}

	public record WorkoutSetResponse(
		String id,
		int setNumber,
		int reps,
		BigDecimal weight,
		String weightUnit,
		BigDecimal rpe,
		Boolean isWarmup
	) {
	}

	public record CreateWorkoutRequest(
		@NotBlank
		@Size(max = 160)
		String title,

		@NotBlank
		String date,

		@Valid
		List<WorkoutExerciseRequest> exercises,

		String notes,

		@Pattern(regexp = "active|completed")
		String status
	) {
	}

	public record UpdateWorkoutRequest(
		@Size(min = 1, max = 160)
		String title,

		String date,

		@Valid
		List<WorkoutExerciseRequest> exercises,

		String notes,

		@Pattern(regexp = "active|completed")
		String status
	) {
	}

	public record WorkoutExerciseRequest(
		String id,

		@Valid
		ExerciseInput exercise,

		@Valid
		List<WorkoutSetRequest> sets,

		String notes
	) {
	}

	public record ExerciseInput(
		String id,

		@NotBlank
		@Size(max = 160)
		String name,

		@NotBlank
		@Size(max = 80)
		String muscleGroup,

		@NotBlank
		@Size(max = 80)
		String equipment,

		Boolean isCustom
	) {
	}

	public record WorkoutSetRequest(
		String id,

		@Min(1)
		Integer setNumber,

		@Min(0)
		Integer reps,

		@DecimalMin("0.0")
		BigDecimal weight,

		@Pattern(regexp = "lb|kg")
		String weightUnit,

		@DecimalMin("0.0")
		@Max(10)
		BigDecimal rpe,

		Boolean isWarmup
	) {
	}
}
