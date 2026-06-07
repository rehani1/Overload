package com.rehanislam.overload.analytics;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.analytics.AnalyticsDtos.MuscleGroupVolumeResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.RecentActivityResponse;
import com.rehanislam.overload.analytics.AnalyticsDtos.TotalVolumeResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AnalyticsRepository {

	private final JdbcTemplate jdbcTemplate;

	public AnalyticsRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public long countCompletedWorkouts(UUID userId, LocalDate from, LocalDate to) {
		Long count = jdbcTemplate.queryForObject(
			"""
			select count(*)
			from workouts
			where user_id = ?
			  and status = 'completed'
			  and workout_date between ? and ?
			""",
			Long.class,
			userId,
			from,
			to
		);
		return count == null ? 0 : count;
	}

	public List<TotalVolumeResponse> findTotalVolumeByUnit(UUID userId, LocalDate from, LocalDate to) {
		return jdbcTemplate.query(
			"""
			select
			    ws.weight_unit,
			    coalesce(sum(ws.reps * ws.weight), 0) as total_volume
			from workouts w
			join workout_exercises we on we.workout_id = w.id
			join workout_sets ws on ws.workout_exercise_id = we.id
			where w.user_id = ?
			  and w.status = 'completed'
			  and w.workout_date between ? and ?
			group by ws.weight_unit
			order by total_volume desc, ws.weight_unit asc
			""",
			(rs, rowNum) -> new TotalVolumeResponse(
				rs.getString("weight_unit"),
				scale(rs.getBigDecimal("total_volume"))
			),
			userId,
			from,
			to
		);
	}

	public List<MuscleGroupVolumeResponse> findMuscleGroupVolume(UUID userId, LocalDate from, LocalDate to) {
		return jdbcTemplate.query(
			"""
			select
			    we.muscle_group,
			    ws.weight_unit,
			    coalesce(sum(ws.reps * ws.weight), 0) as total_volume
			from workouts w
			join workout_exercises we on we.workout_id = w.id
			join workout_sets ws on ws.workout_exercise_id = we.id
			where w.user_id = ?
			  and w.status = 'completed'
			  and w.workout_date between ? and ?
			group by we.muscle_group, ws.weight_unit
			order by total_volume desc, lower(we.muscle_group) asc, ws.weight_unit asc
			""",
			(rs, rowNum) -> new MuscleGroupVolumeResponse(
				rs.getString("muscle_group"),
				rs.getString("weight_unit"),
				scale(rs.getBigDecimal("total_volume"))
			),
			userId,
			from,
			to
		);
	}

	public NutritionStats findNutritionStats(UUID userId, LocalDate from, LocalDate to) {
		return jdbcTemplate.queryForObject(
			"""
			select
			    count(*) as logged_days,
			    coalesce(avg(daily.calories), 0) as average_calories,
			    coalesce(avg(daily.protein_grams), 0) as average_protein_grams,
			    coalesce(avg(daily.carbs_grams), 0) as average_carbs_grams,
			    coalesce(avg(daily.fat_grams), 0) as average_fat_grams
			from (
			    select
			        log_date,
			        sum(calories) as calories,
			        sum(protein_grams) as protein_grams,
			        sum(carbs_grams) as carbs_grams,
			        sum(fat_grams) as fat_grams
			    from nutrition_entries
			    where user_id = ?
			      and log_date between ? and ?
			    group by log_date
			) daily
			""",
			(rs, rowNum) -> new NutritionStats(
				rs.getLong("logged_days"),
				scale(rs.getBigDecimal("average_calories")),
				scale(rs.getBigDecimal("average_protein_grams")),
				scale(rs.getBigDecimal("average_carbs_grams")),
				scale(rs.getBigDecimal("average_fat_grams"))
			),
			userId,
			from,
			to
		);
	}

	public Optional<NutritionTargetStats> findTargetStats(UUID userId, LocalDate to) {
		List<NutritionTargetStats> rows = jdbcTemplate.query(
			"""
			select daily_calories, protein_grams, carbs_grams, fat_grams
			from nutrition_targets
			where user_id = ?
			  and effective_from <= ?
			order by effective_from desc, updated_at desc
			limit 1
			""",
			(rs, rowNum) -> new NutritionTargetStats(
				rs.getInt("daily_calories"),
				scale(rs.getBigDecimal("protein_grams")),
				scale(rs.getBigDecimal("carbs_grams")),
				scale(rs.getBigDecimal("fat_grams"))
			),
			userId,
			to
		);
		return rows.stream().findFirst();
	}

	public List<RecentActivityResponse> findRecentActivity(UUID userId, LocalDate from, LocalDate to) {
		return jdbcTemplate.query(
			"""
			select id, activity_type, activity_date, title, subtitle
			from (
			    select
			        w.id::text as id,
			        'workout' as activity_type,
			        w.workout_date as activity_date,
			        w.title as title,
			        concat(count(we.id), ' exercises') as subtitle,
			        w.created_at as occurred_at
			    from workouts w
			    left join workout_exercises we on we.workout_id = w.id
			    where w.user_id = ?
			      and w.workout_date between ? and ?
			    group by w.id, w.workout_date, w.title, w.created_at

			    union all

			    select
			        ne.id::text as id,
			        'nutrition' as activity_type,
			        ne.log_date as activity_date,
			        ne.food_name as title,
			        concat(ne.meal_type, ' - ', ne.calories, ' calories') as subtitle,
			        ne.created_at as occurred_at
			    from nutrition_entries ne
			    where ne.user_id = ?
			      and ne.log_date between ? and ?
			) activity
			order by activity_date desc, occurred_at desc
			limit 10
			""",
			(rs, rowNum) -> mapRecentActivity(rs),
			userId,
			from,
			to,
			userId,
			from,
			to
		);
	}

	private RecentActivityResponse mapRecentActivity(ResultSet rs) throws SQLException {
		return new RecentActivityResponse(
			rs.getString("id"),
			rs.getString("activity_type"),
			rs.getObject("activity_date", LocalDate.class).toString(),
			rs.getString("title"),
			rs.getString("subtitle")
		);
	}

	private BigDecimal scale(BigDecimal value) {
		if (value == null) {
			return BigDecimal.ZERO.setScale(1);
		}
		return value.setScale(1, java.math.RoundingMode.HALF_UP);
	}

	public record NutritionStats(
		long loggedDays,
		BigDecimal averageCalories,
		BigDecimal averageProteinGrams,
		BigDecimal averageCarbsGrams,
		BigDecimal averageFatGrams
	) {
	}

	public record NutritionTargetStats(
		int dailyCalories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams
	) {
	}
}
