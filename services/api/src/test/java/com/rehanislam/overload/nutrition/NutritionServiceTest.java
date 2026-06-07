package com.rehanislam.overload.nutrition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.nutrition.NutritionDtos.CreateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionRepository.NutritionEntryWrite;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NutritionServiceTest {

	@Mock
	private NutritionRepository nutritionRepository;

	@InjectMocks
	private NutritionService nutritionService;

	@Test
	void createEntryDerivesCaloriesFromMacros() {
		UUID userId = UUID.randomUUID();
		UUID clientId = UUID.randomUUID();
		when(nutritionRepository.findByClientId(userId, clientId)).thenReturn(Optional.empty());
		when(nutritionRepository.create(eq(userId), any(NutritionEntryWrite.class)))
			.thenAnswer(invocation -> {
				NutritionEntryWrite write = invocation.getArgument(1);
				return new NutritionEntryResponse(
					UUID.randomUUID().toString(),
					write.date().toString(),
					write.mealType(),
					write.foodName(),
					write.servingQuantity(),
					write.calories(),
					write.proteinGrams(),
					write.carbsGrams(),
					write.fatGrams(),
					write.notes(),
					Instant.now(),
					Instant.now()
				);
			});

		NutritionEntryResponse response = nutritionService.createEntry(userId, new CreateNutritionEntryRequest(
			"2026-06-07",
			"lunch",
			"Chicken bowl",
			new BigDecimal("1"),
			9999,
			new BigDecimal("40"),
			new BigDecimal("50"),
			new BigDecimal("10"),
			null,
			clientId.toString()
		));

		assertThat(response.calories()).isEqualTo(450);
		ArgumentCaptor<NutritionEntryWrite> captor = ArgumentCaptor.forClass(NutritionEntryWrite.class);
		verify(nutritionRepository).create(eq(userId), captor.capture());
		assertThat(captor.getValue().date()).isEqualTo(LocalDate.parse("2026-06-07"));
		assertThat(captor.getValue().calories()).isEqualTo(450);
	}

	@Test
	void createEntryReturnsExistingEntryForRepeatedClientId() {
		UUID userId = UUID.randomUUID();
		UUID clientId = UUID.randomUUID();
		NutritionEntryResponse existing = new NutritionEntryResponse(
			UUID.randomUUID().toString(),
			"2026-06-07",
			"snack",
			"Greek yogurt",
			BigDecimal.ONE,
			120,
			new BigDecimal("20.00"),
			new BigDecimal("10.00"),
			BigDecimal.ZERO,
			null,
			Instant.now(),
			Instant.now()
		);
		when(nutritionRepository.findByClientId(userId, clientId)).thenReturn(Optional.of(existing));

		NutritionEntryResponse response = nutritionService.createEntry(userId, new CreateNutritionEntryRequest(
			"2026-06-07",
			"snack",
			"Greek yogurt",
			BigDecimal.ONE,
			null,
			new BigDecimal("20"),
			new BigDecimal("10"),
			BigDecimal.ZERO,
			null,
			clientId.toString()
		));

		assertThat(response).isSameAs(existing);
		verify(nutritionRepository, never()).create(any(), any());
	}
}
