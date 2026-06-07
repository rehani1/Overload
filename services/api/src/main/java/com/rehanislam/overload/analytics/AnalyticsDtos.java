package com.rehanislam.overload.analytics;

import java.math.BigDecimal;
import java.util.List;

public final class AnalyticsDtos {

	private AnalyticsDtos() {
	}

	public record AnalyticsSummaryResponse(
		DateRangeResponse dateRange,
		long workoutCount,
		List<TotalVolumeResponse> totalVolumeByUnit,
		List<MuscleGroupVolumeResponse> muscleGroupVolume,
		NutritionAveragesResponse nutritionAverages,
		TargetAdherenceResponse targetAdherence,
		List<RecentActivityResponse> recentActivity
	) {
	}

	public record DateRangeResponse(
		String from,
		String to
	) {
	}

	public record TotalVolumeResponse(
		String weightUnit,
		BigDecimal totalVolume
	) {
	}

	public record MuscleGroupVolumeResponse(
		String muscleGroup,
		String weightUnit,
		BigDecimal totalVolume
	) {
	}

	public record NutritionAveragesResponse(
		long loggedDays,
		BigDecimal calories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams
	) {
	}

	public record TargetAdherenceResponse(
		int dailyCalories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams,
		BigDecimal calorieAdherencePercent,
		BigDecimal proteinAdherencePercent,
		BigDecimal carbsAdherencePercent,
		BigDecimal fatAdherencePercent,
		BigDecimal averageCalorieDelta
	) {
	}

	public record RecentActivityResponse(
		String id,
		String type,
		String date,
		String title,
		String subtitle
	) {
	}
}
