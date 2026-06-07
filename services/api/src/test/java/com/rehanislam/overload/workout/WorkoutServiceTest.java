package com.rehanislam.overload.workout;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.workout.WorkoutDtos.CreateWorkoutRequest;
import com.rehanislam.overload.workout.WorkoutDtos.ExerciseInput;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutExerciseRequest;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutSetRequest;
import com.rehanislam.overload.workout.WorkoutRepository.WorkoutWrite;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {

	@Mock
	private WorkoutRepository workoutRepository;

	@InjectMocks
	private WorkoutService workoutService;

	@Test
	void createPreservesSetWeightUnit() {
		UUID userId = UUID.randomUUID();
		when(workoutRepository.create(eq(userId), any(WorkoutWrite.class)))
			.thenReturn(new WorkoutResponse(
				UUID.randomUUID().toString(),
				"Lower Day",
				"2026-06-07",
				List.of(),
				null,
				"completed"
			));

		workoutService.create(userId, new CreateWorkoutRequest(
			"Lower Day",
			"2026-06-07T18:00:00.000Z",
			List.of(new WorkoutExerciseRequest(
				"client-exercise-row",
				new ExerciseInput(
					"client-exercise",
					"Back Squat",
					"Legs",
					"Barbell",
					true
				),
				List.of(new WorkoutSetRequest(
					"client-set",
					1,
					5,
					new BigDecimal("100"),
					"kg",
					new BigDecimal("8"),
					false
				)),
				null
			)),
			null,
			"completed"
		));

		ArgumentCaptor<WorkoutWrite> captor = ArgumentCaptor.forClass(WorkoutWrite.class);
		verify(workoutRepository).create(eq(userId), captor.capture());
		assertThat(captor.getValue().exercises().getFirst().sets().getFirst().weightUnit()).isEqualTo("kg");
		assertThat(captor.getValue().exercises().getFirst().sets().getFirst().weight()).isEqualByComparingTo("100.00");
	}
}
