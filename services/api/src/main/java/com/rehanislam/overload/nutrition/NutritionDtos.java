package com.rehanislam.overload.nutrition;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class NutritionDtos {

	private NutritionDtos() {
	}

	public record NutritionEntryResponse(
		String id,
		String date,
		String mealType,
		String foodName,
		BigDecimal servingQuantity,
		int calories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams,
		String notes,
		Instant createdAt,
		Instant updatedAt
	) {
	}

	public record NutritionTargetResponse(
		String id,
		int dailyCalories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams,
		Instant updatedAt
	) {
	}

	public record CreateNutritionEntryRequest(
		@NotBlank
		String date,

		@NotBlank
		@Pattern(regexp = "breakfast|lunch|dinner|snack")
		String mealType,

		@NotBlank
		@Size(max = 160)
		String foodName,

		@DecimalMin(value = "0.01")
		BigDecimal servingQuantity,

		Integer calories,

		@DecimalMin("0.0")
		BigDecimal proteinGrams,

		@DecimalMin("0.0")
		BigDecimal carbsGrams,

		@DecimalMin("0.0")
		BigDecimal fatGrams,

		String notes,

		String clientId
	) {
	}

	public record UpdateNutritionEntryRequest(
		String date,

		@Pattern(regexp = "breakfast|lunch|dinner|snack")
		String mealType,

		@Size(min = 1, max = 160)
		String foodName,

		@DecimalMin(value = "0.01")
		BigDecimal servingQuantity,

		Integer calories,

		@DecimalMin("0.0")
		BigDecimal proteinGrams,

		@DecimalMin("0.0")
		BigDecimal carbsGrams,

		@DecimalMin("0.0")
		BigDecimal fatGrams,

		String notes
	) {
	}

	public record UpdateNutritionTargetRequest(
		Integer dailyCalories,

		@DecimalMin("0.0")
		BigDecimal proteinGrams,

		@DecimalMin("0.0")
		BigDecimal carbsGrams,

		@DecimalMin("0.0")
		BigDecimal fatGrams
	) {
	}
}
