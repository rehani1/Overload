package com.rehanislam.overload.preset;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.preset.PresetDtos.MealPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PresetRepository {

	private final JdbcTemplate jdbcTemplate;
	private final ObjectMapper objectMapper;

	public PresetRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
		this.jdbcTemplate = jdbcTemplate;
		this.objectMapper = objectMapper;
	}

	public List<WorkoutPresetResponse> findWorkoutPresets(UUID userId) {
		return jdbcTemplate.query(
			"""
			select id, created_at, title, workout_json
			from workout_presets
			where user_id = ?
			order by created_at desc
			""",
			(rs, rowNum) -> mapWorkoutPreset(rs),
			userId
		);
	}

	public Optional<WorkoutPresetResponse> findWorkoutPreset(UUID userId, UUID presetId) {
		List<WorkoutPresetResponse> rows = jdbcTemplate.query(
			"""
			select id, created_at, title, workout_json
			from workout_presets
			where user_id = ? and id = ?
			""",
			(rs, rowNum) -> mapWorkoutPreset(rs),
			userId,
			presetId
		);
		return rows.stream().findFirst();
	}

	public WorkoutPresetResponse createWorkoutPreset(UUID userId, String title, WorkoutResponse workout) {
		return jdbcTemplate.queryForObject(
			"""
			insert into workout_presets
			    (user_id, title, workout_json)
			values (?, ?, cast(? as jsonb))
			returning id, created_at, title, workout_json
			""",
			(rs, rowNum) -> mapWorkoutPreset(rs),
			userId,
			title,
			toJson(workout)
		);
	}

	public Optional<WorkoutPresetResponse> updateWorkoutPreset(
		UUID userId,
		UUID presetId,
		String title,
		WorkoutResponse workout
	) {
		List<WorkoutPresetResponse> rows = jdbcTemplate.query(
			"""
			update workout_presets
			set title = ?, workout_json = cast(? as jsonb), updated_at = now()
			where user_id = ? and id = ?
			returning id, created_at, title, workout_json
			""",
			(rs, rowNum) -> mapWorkoutPreset(rs),
			title,
			toJson(workout),
			userId,
			presetId
		);
		return rows.stream().findFirst();
	}

	public boolean deleteWorkoutPreset(UUID userId, UUID presetId) {
		return jdbcTemplate.update(
			"delete from workout_presets where user_id = ? and id = ?",
			userId,
			presetId
		) > 0;
	}

	public List<MealPresetResponse> findMealPresets(UUID userId) {
		return jdbcTemplate.query(
			"""
			select id, created_at, food_name, entry_json
			from meal_presets
			where user_id = ?
			order by created_at desc
			""",
			(rs, rowNum) -> mapMealPreset(rs),
			userId
		);
	}

	public Optional<MealPresetResponse> findMealPreset(UUID userId, UUID presetId) {
		List<MealPresetResponse> rows = jdbcTemplate.query(
			"""
			select id, created_at, food_name, entry_json
			from meal_presets
			where user_id = ? and id = ?
			""",
			(rs, rowNum) -> mapMealPreset(rs),
			userId,
			presetId
		);
		return rows.stream().findFirst();
	}

	public MealPresetResponse createMealPreset(UUID userId, String foodName, NutritionEntryResponse entry) {
		return jdbcTemplate.queryForObject(
			"""
			insert into meal_presets
			    (user_id, food_name, entry_json)
			values (?, ?, cast(? as jsonb))
			returning id, created_at, food_name, entry_json
			""",
			(rs, rowNum) -> mapMealPreset(rs),
			userId,
			foodName,
			toJson(entry)
		);
	}

	public Optional<MealPresetResponse> updateMealPreset(
		UUID userId,
		UUID presetId,
		String foodName,
		NutritionEntryResponse entry
	) {
		List<MealPresetResponse> rows = jdbcTemplate.query(
			"""
			update meal_presets
			set food_name = ?, entry_json = cast(? as jsonb), updated_at = now()
			where user_id = ? and id = ?
			returning id, created_at, food_name, entry_json
			""",
			(rs, rowNum) -> mapMealPreset(rs),
			foodName,
			toJson(entry),
			userId,
			presetId
		);
		return rows.stream().findFirst();
	}

	public boolean deleteMealPreset(UUID userId, UUID presetId) {
		return jdbcTemplate.update(
			"delete from meal_presets where user_id = ? and id = ?",
			userId,
			presetId
		) > 0;
	}

	private WorkoutPresetResponse mapWorkoutPreset(ResultSet rs) throws SQLException {
		return new WorkoutPresetResponse(
			rs.getObject("id", UUID.class).toString(),
			toInstant(rs, "created_at"),
			rs.getString("title"),
			fromJson(rs.getString("workout_json"), WorkoutResponse.class)
		);
	}

	private MealPresetResponse mapMealPreset(ResultSet rs) throws SQLException {
		return new MealPresetResponse(
			rs.getObject("id", UUID.class).toString(),
			toInstant(rs, "created_at"),
			rs.getString("food_name"),
			fromJson(rs.getString("entry_json"), NutritionEntryResponse.class)
		);
	}

	private Instant toInstant(ResultSet rs, String column) throws SQLException {
		return rs.getTimestamp(column).toInstant();
	}

	private String toJson(Object value) {
		try {
			return objectMapper.writeValueAsString(value);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Unable to serialize preset JSON.", ex);
		}
	}

	private <T> T fromJson(String json, Class<T> type) {
		try {
			return objectMapper.readValue(json, type);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Unable to deserialize preset JSON.", ex);
		}
	}
}
