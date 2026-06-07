package com.rehanislam.overload.exercise;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ExerciseDtos {

	private ExerciseDtos() {
	}

	public record ExerciseResponse(
		String id,
		String name,
		String muscleGroup,
		String equipment,
		boolean isCustom
	) {
		static ExerciseResponse from(ExerciseRow exercise) {
			return new ExerciseResponse(
				exercise.id(),
				exercise.name(),
				exercise.muscleGroup(),
				exercise.equipment(),
				exercise.isCustom()
			);
		}
	}

	public record ExerciseRequest(
		@NotBlank
		@Size(max = 160)
		String name,

		@NotBlank
		@Size(max = 80)
		String muscleGroup,

		@NotBlank
		@Size(max = 80)
		String equipment
	) {
	}
}
