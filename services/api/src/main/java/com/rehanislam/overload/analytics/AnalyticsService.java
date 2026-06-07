package com.rehanislam.overload.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

import com.rehanislam.overload.analytics.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.DateRangeResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.NutritionAveragesResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.TargetAdherenceResponse;
import com.rehanislam.overload.analytics.AnalyticsRepository.NutritionStats;
import com.rehanislam.overload.analytics.AnalyticsRepository.NutritionTargetStats;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AnalyticsService {

	private final AnalyticsRepository analyticsRepository;
	private final Clock clock;

	public AnalyticsService(AnalyticsRepository analyticsRepository, Clock clock) {
		this.analyticsRepository = analyticsRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public AnalyticsSummaryResponse summarize(UUID userId, String fromValue, String toValue) {
		DateRange range = resolveDateRange(fromValue, toValue);
		NutritionStats nutritionStats = analyticsRepository.findNutritionStats(userId, range.from(), range.to());
		NutritionTargetStats targetStats = analyticsRepository.findTargetStats(userId, range.to())
			.orElseGet(this::emptyTarget);

		return new AnalyticsSummaryResponse(
			new DateRangeResponse(range.from().toString(), range.to().toString()),
			analyticsRepository.countCompletedWorkouts(userId, range.from(), range.to()),
			analyticsRepository.findTotalVolumeByUnit(userId, range.from(), range.to()),
			analyticsRepository.findMuscleGroupVolume(userId, range.from(), range.to()),
			new NutritionAveragesResponse(
				nutritionStats.loggedDays(),
				nutritionStats.averageCalories(),
				nutritionStats.averageProteinGrams(),
				nutritionStats.averageCarbsGrams(),
				nutritionStats.averageFatGrams()
			),
			toAdherence(nutritionStats, targetStats),
			analyticsRepository.findRecentActivity(userId, range.from(), range.to())
		);
	}

	DateRange resolveDateRange(String fromValue, String toValue) {
		LocalDate to = toValue == null || toValue.isBlank()
			? LocalDate.now(clock)
			: parseDate(toValue);
		LocalDate from = fromValue == null || fromValue.isBlank()
			? to.minusDays(29)
			: parseDate(fromValue);

		if (from.isAfter(to)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must be before or equal to to.");
		}
		return new DateRange(from, to);
	}

	TargetAdherenceResponse toAdherence(NutritionStats nutritionStats, NutritionTargetStats targetStats) {
		BigDecimal averageCalories = nutritionStats.averageCalories();
		return new TargetAdherenceResponse(
			targetStats.dailyCalories(),
			targetStats.proteinGrams(),
			targetStats.carbsGrams(),
			targetStats.fatGrams(),
			adherence(averageCalories, BigDecimal.valueOf(targetStats.dailyCalories())),
			adherence(nutritionStats.averageProteinGrams(), targetStats.proteinGrams()),
			adherence(nutritionStats.averageCarbsGrams(), targetStats.carbsGrams()),
			adherence(nutritionStats.averageFatGrams(), targetStats.fatGrams()),
			targetStats.dailyCalories() == 0
				? BigDecimal.ZERO.setScale(1)
				: scale(averageCalories.subtract(BigDecimal.valueOf(targetStats.dailyCalories())))
		);
	}

	private BigDecimal adherence(BigDecimal actual, BigDecimal target) {
		if (target == null || target.compareTo(BigDecimal.ZERO) == 0) {
			return BigDecimal.ZERO.setScale(1);
		}
		return actual.multiply(BigDecimal.valueOf(100))
			.divide(target, 1, RoundingMode.HALF_UP);
	}

	private NutritionTargetStats emptyTarget() {
		return new NutritionTargetStats(
			0,
			BigDecimal.ZERO.setScale(1),
			BigDecimal.ZERO.setScale(1),
			BigDecimal.ZERO.setScale(1)
		);
	}

	private LocalDate parseDate(String value) {
		try {
			String trimmed = value.trim();
			return LocalDate.parse(trimmed.length() >= 10 ? trimmed.substring(0, 10) : trimmed);
		} catch (RuntimeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an ISO date.");
		}
	}

	private BigDecimal scale(BigDecimal value) {
		return value.setScale(1, RoundingMode.HALF_UP);
	}

	record DateRange(LocalDate from, LocalDate to) {
	}
}
