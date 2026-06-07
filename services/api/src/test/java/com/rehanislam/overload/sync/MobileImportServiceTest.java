package com.rehanislam.overload.sync;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.nutrition.NutritionDtos.CreateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionTargetRequest;
import com.rehanislam.overload.nutrition.NutritionService;
import com.rehanislam.overload.preset.PresetService;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportRequest;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;
import com.rehanislam.overload.workout.WorkoutService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MobileImportServiceTest {

	@Mock
	private NutritionService nutritionService;

	@Mock
	private PresetService presetService;

	@Mock
	private WorkoutService workoutService;

	@InjectMocks
	private MobileImportService mobileImportService;

	@Test
	void importsTargetEntriesAndActiveWorkout() {
		UUID userId = UUID.randomUUID();
		NutritionTargetResponse target = new NutritionTargetResponse(
			UUID.randomUUID().toString(),
			2415,
			new BigDecimal("180"),
			new BigDecimal("260"),
			new BigDecimal("75"),
			Instant.parse("2026-06-07T12:00:00Z")
		);
		NutritionEntryResponse entry = new NutritionEntryResponse(
			"entry-local-1",
			"2026-06-07",
			"lunch",
			"Chicken bowl",
			BigDecimal.ONE,
			9999,
			new BigDecimal("40"),
			new BigDecimal("50"),
			new BigDecimal("10"),
			null,
			Instant.parse("2026-06-07T12:00:00Z"),
			Instant.parse("2026-06-07T12:00:00Z")
		);
		WorkoutResponse activeWorkout = new WorkoutResponse(
			"workout-local-1",
			"Active workout",
			"2026-06-07",
			List.of(),
			null,
			"active"
		);

		MobileImportResponse response = mobileImportService.importMobileData(userId, new MobileImportRequest(
			target,
			List.of(entry),
			List.of(),
			activeWorkout,
			List.of(),
			List.of()
		));

		assertThat(response.nutritionEntries()).isEqualTo(1);
		assertThat(response.activeWorkouts()).isEqualTo(1);
		ArgumentCaptor<UpdateNutritionTargetRequest> targetCaptor =
			ArgumentCaptor.forClass(UpdateNutritionTargetRequest.class);
		verify(nutritionService).updateTarget(eq(userId), targetCaptor.capture());
		assertThat(targetCaptor.getValue().proteinGrams()).isEqualByComparingTo("180");

		ArgumentCaptor<CreateNutritionEntryRequest> entryCaptor =
			ArgumentCaptor.forClass(CreateNutritionEntryRequest.class);
		verify(nutritionService).createEntry(eq(userId), entryCaptor.capture());
		assertThat(entryCaptor.getValue().calories()).isEqualTo(9999);
		assertThat(entryCaptor.getValue().clientId()).isNotBlank();

		ArgumentCaptor<WorkoutResponse> workoutCaptor = ArgumentCaptor.forClass(WorkoutResponse.class);
		verify(workoutService).importWorkout(eq(userId), workoutCaptor.capture());
		assertThat(workoutCaptor.getValue().status()).isEqualTo("active");
	}
}
