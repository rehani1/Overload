package com.rehanislam.overload.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.analytics.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.MuscleGroupVolumeResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.RecentActivityResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.TotalVolumeResponse;
import com.rehanislam.overload.analytics.AnalyticsRepository.NutritionStats;
import com.rehanislam.overload.analytics.AnalyticsRepository.NutritionTargetStats;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

	private static final Clock FIXED_CLOCK = Clock.fixed(
		Instant.parse("2026-06-07T12:00:00Z"),
		ZoneOffset.UTC
	);

	@Mock
	private AnalyticsRepository analyticsRepository;

	private AnalyticsService analyticsService;

	@BeforeEach
	void setUp() {
		analyticsService = new AnalyticsService(analyticsRepository, FIXED_CLOCK);
	}

	@Test
	void summarizeDefaultsToLastThirtyDaysAndCalculatesTargetAdherence() {
		UUID userId = UUID.randomUUID();
		LocalDate from = LocalDate.parse("2026-05-09");
		LocalDate to = LocalDate.parse("2026-06-07");
		when(analyticsRepository.findNutritionStats(userId, from, to))
			.thenReturn(new NutritionStats(
				2,
				new BigDecimal("2000.0"),
				new BigDecimal("150.0"),
				new BigDecimal("250.0"),
				new BigDecimal("60.0")
			));
		when(analyticsRepository.findTargetStats(userId, to))
			.thenReturn(Optional.of(new NutritionTargetStats(
				2200,
				new BigDecimal("160.0"),
				new BigDecimal("250.0"),
				new BigDecimal("70.0")
			)));
		when(analyticsRepository.countCompletedWorkouts(userId, from, to)).thenReturn(3L);
		when(analyticsRepository.findTotalVolumeByUnit(userId, from, to))
			.thenReturn(List.of(
				new TotalVolumeResponse("lb", new BigDecimal("1200.0")),
				new TotalVolumeResponse("kg", new BigDecimal("500.0"))
			));
		when(analyticsRepository.findMuscleGroupVolume(userId, from, to))
			.thenReturn(List.of(new MuscleGroupVolumeResponse("legs", "lb", new BigDecimal("800.0"))));
		when(analyticsRepository.findRecentActivity(userId, from, to))
			.thenReturn(List.of(new RecentActivityResponse(
				"activity-id",
				"workout",
				"2026-06-07",
				"Lower Day",
				"3 exercises"
			)));

		AnalyticsSummaryResponse response = analyticsService.summarize(userId, null, null);

		assertThat(response.dateRange().from()).isEqualTo("2026-05-09");
		assertThat(response.dateRange().to()).isEqualTo("2026-06-07");
		assertThat(response.workoutCount()).isEqualTo(3);
		assertThat(response.totalVolumeByUnit()).extracting(TotalVolumeResponse::weightUnit)
			.containsExactly("lb", "kg");
		assertThat(response.nutritionAverages().loggedDays()).isEqualTo(2);
		assertThat(response.targetAdherence().calorieAdherencePercent()).isEqualByComparingTo("90.9");
		assertThat(response.targetAdherence().proteinAdherencePercent()).isEqualByComparingTo("93.8");
		assertThat(response.targetAdherence().carbsAdherencePercent()).isEqualByComparingTo("100.0");
		assertThat(response.targetAdherence().fatAdherencePercent()).isEqualByComparingTo("85.7");
		assertThat(response.targetAdherence().averageCalorieDelta()).isEqualByComparingTo("-200.0");
		assertThat(response.recentActivity()).hasSize(1);
	}

	@Test
	void summarizeRejectsRangeWhenFromIsAfterTo() {
		assertThatThrownBy(() -> analyticsService.summarize(
			UUID.randomUUID(),
			"2026-06-08",
			"2026-06-07"
		))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("400");
	}

	@Test
	void targetAdherenceUsesZeroesWhenTargetIsMissing() {
		NutritionStats nutritionStats = new NutritionStats(
			1,
			new BigDecimal("1800.0"),
			new BigDecimal("120.0"),
			new BigDecimal("200.0"),
			new BigDecimal("50.0")
		);
		NutritionTargetStats targetStats = new NutritionTargetStats(
			0,
			BigDecimal.ZERO.setScale(1),
			BigDecimal.ZERO.setScale(1),
			BigDecimal.ZERO.setScale(1)
		);

		AnalyticsDtos.TargetAdherenceResponse response = analyticsService.toAdherence(nutritionStats, targetStats);

		assertThat(response.calorieAdherencePercent()).isEqualByComparingTo("0.0");
		assertThat(response.proteinAdherencePercent()).isEqualByComparingTo("0.0");
		assertThat(response.carbsAdherencePercent()).isEqualByComparingTo("0.0");
		assertThat(response.fatAdherencePercent()).isEqualByComparingTo("0.0");
		assertThat(response.averageCalorieDelta()).isEqualByComparingTo("0.0");
	}
}
