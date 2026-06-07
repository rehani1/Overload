package com.rehanislam.overload.nutrition;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NutritionRepository {

	private final JdbcTemplate jdbcTemplate;

	public NutritionRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public List<NutritionEntryResponse> findEntries(UUID userId, LocalDate date) {
		if (date == null) {
			return jdbcTemplate.query(
				"""
				select *
				from nutrition_entries
				where user_id = ?
				order by log_date desc, created_at desc
				""",
				(rs, rowNum) -> mapEntry(rs),
				userId
			);
		}
		return jdbcTemplate.query(
			"""
			select *
			from nutrition_entries
			where user_id = ? and log_date = ?
			order by created_at desc
			""",
			(rs, rowNum) -> mapEntry(rs),
			userId,
			date
		);
	}

	public Optional<NutritionEntryResponse> findEntry(UUID userId, UUID entryId) {
		List<NutritionEntryResponse> rows = jdbcTemplate.query(
			"select * from nutrition_entries where user_id = ? and id = ?",
			(rs, rowNum) -> mapEntry(rs),
			userId,
			entryId
		);
		return rows.stream().findFirst();
	}

	public Optional<NutritionEntryResponse> findByClientId(UUID userId, UUID clientId) {
		List<NutritionEntryResponse> rows = jdbcTemplate.query(
			"select * from nutrition_entries where user_id = ? and client_id = ?",
			(rs, rowNum) -> mapEntry(rs),
			userId,
			clientId
		);
		return rows.stream().findFirst();
	}

	public NutritionEntryResponse create(UUID userId, NutritionEntryWrite entry) {
		return jdbcTemplate.queryForObject(
			"""
			insert into nutrition_entries
			    (
			        user_id,
			        client_id,
			        log_date,
			        meal_type,
			        food_name,
			        serving_quantity,
			        calories,
			        protein_grams,
			        carbs_grams,
			        fat_grams,
			        notes
			    )
			values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			returning *
			""",
			(rs, rowNum) -> mapEntry(rs),
			userId,
			entry.clientId(),
			entry.date(),
			entry.mealType(),
			entry.foodName(),
			entry.servingQuantity(),
			entry.calories(),
			entry.proteinGrams(),
			entry.carbsGrams(),
			entry.fatGrams(),
			entry.notes()
		);
	}

	public Optional<NutritionEntryResponse> update(UUID userId, UUID entryId, NutritionEntryWrite entry) {
		List<NutritionEntryResponse> rows = jdbcTemplate.query(
			"""
			update nutrition_entries
			set
			    log_date = ?,
			    meal_type = ?,
			    food_name = ?,
			    serving_quantity = ?,
			    calories = ?,
			    protein_grams = ?,
			    carbs_grams = ?,
			    fat_grams = ?,
			    notes = ?,
			    updated_at = now()
			where user_id = ? and id = ?
			returning *
			""",
			(rs, rowNum) -> mapEntry(rs),
			entry.date(),
			entry.mealType(),
			entry.foodName(),
			entry.servingQuantity(),
			entry.calories(),
			entry.proteinGrams(),
			entry.carbsGrams(),
			entry.fatGrams(),
			entry.notes(),
			userId,
			entryId
		);
		return rows.stream().findFirst();
	}

	public boolean delete(UUID userId, UUID entryId) {
		return jdbcTemplate.update(
			"delete from nutrition_entries where user_id = ? and id = ?",
			userId,
			entryId
		) > 0;
	}

	public Optional<NutritionTargetResponse> findLatestTarget(UUID userId) {
		List<NutritionTargetResponse> rows = jdbcTemplate.query(
			"""
			select *
			from nutrition_targets
			where user_id = ?
			order by effective_from desc, updated_at desc
			limit 1
			""",
			(rs, rowNum) -> mapTarget(rs),
			userId
		);
		return rows.stream().findFirst();
	}

	public NutritionTargetResponse upsertTarget(UUID userId, NutritionTargetWrite target) {
		return jdbcTemplate.queryForObject(
			"""
			insert into nutrition_targets
			    (user_id, daily_calories, protein_grams, carbs_grams, fat_grams, effective_from)
			values (?, ?, ?, ?, ?, current_date)
			on conflict (user_id, effective_from)
			do update set
			    daily_calories = excluded.daily_calories,
			    protein_grams = excluded.protein_grams,
			    carbs_grams = excluded.carbs_grams,
			    fat_grams = excluded.fat_grams,
			    updated_at = now()
			returning *
			""",
			(rs, rowNum) -> mapTarget(rs),
			userId,
			target.dailyCalories(),
			target.proteinGrams(),
			target.carbsGrams(),
			target.fatGrams()
		);
	}

	private NutritionEntryResponse mapEntry(ResultSet rs) throws SQLException {
		return new NutritionEntryResponse(
			rs.getObject("id", UUID.class).toString(),
			rs.getObject("log_date", LocalDate.class).toString(),
			rs.getString("meal_type"),
			rs.getString("food_name"),
			rs.getBigDecimal("serving_quantity"),
			rs.getInt("calories"),
			rs.getBigDecimal("protein_grams"),
			rs.getBigDecimal("carbs_grams"),
			rs.getBigDecimal("fat_grams"),
			rs.getString("notes"),
			rs.getTimestamp("created_at").toInstant(),
			rs.getTimestamp("updated_at").toInstant()
		);
	}

	private NutritionTargetResponse mapTarget(ResultSet rs) throws SQLException {
		return new NutritionTargetResponse(
			rs.getObject("id", UUID.class).toString(),
			rs.getInt("daily_calories"),
			rs.getBigDecimal("protein_grams"),
			rs.getBigDecimal("carbs_grams"),
			rs.getBigDecimal("fat_grams"),
			rs.getTimestamp("updated_at").toInstant()
		);
	}

	public record NutritionEntryWrite(
		UUID clientId,
		LocalDate date,
		String mealType,
		String foodName,
		BigDecimal servingQuantity,
		int calories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams,
		String notes
	) {
	}

	public record NutritionTargetWrite(
		int dailyCalories,
		BigDecimal proteinGrams,
		BigDecimal carbsGrams,
		BigDecimal fatGrams
	) {
	}
}
