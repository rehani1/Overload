package com.rehanislam.overload.exercise;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ExerciseRepository {

	private final JdbcTemplate jdbcTemplate;

	public ExerciseRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public List<ExerciseRow> findAllVisibleTo(UUID userId) {
		return jdbcTemplate.query(
			"""
			select id, user_id, name, muscle_group, equipment, is_custom
			from exercises
			where user_id is null or user_id = ?
			order by is_custom asc, lower(name) asc
			""",
			(rs, rowNum) -> mapRow(rs),
			userId
		);
	}

	public Optional<ExerciseRow> findVisibleById(UUID userId, UUID exerciseId) {
		List<ExerciseRow> rows = jdbcTemplate.query(
			"""
			select id, user_id, name, muscle_group, equipment, is_custom
			from exercises
			where id = ? and (user_id is null or user_id = ?)
			""",
			(rs, rowNum) -> mapRow(rs),
			exerciseId,
			userId
		);
		return rows.stream().findFirst();
	}

	public ExerciseRow create(UUID userId, String name, String muscleGroup, String equipment) {
		return jdbcTemplate.queryForObject(
			"""
			insert into exercises
			    (user_id, name, muscle_group, equipment, is_custom)
			values (?, ?, ?, ?, true)
			returning id, user_id, name, muscle_group, equipment, is_custom
			""",
			(rs, rowNum) -> mapRow(rs),
			userId,
			name,
			muscleGroup,
			equipment
		);
	}

	public Optional<ExerciseRow> updateCustom(
		UUID userId,
		UUID exerciseId,
		String name,
		String muscleGroup,
		String equipment
	) {
		List<ExerciseRow> rows = jdbcTemplate.query(
			"""
			update exercises
			set name = ?, muscle_group = ?, equipment = ?, updated_at = now()
			where id = ? and user_id = ?
			returning id, user_id, name, muscle_group, equipment, is_custom
			""",
			(rs, rowNum) -> mapRow(rs),
			name,
			muscleGroup,
			equipment,
			exerciseId,
			userId
		);
		return rows.stream().findFirst();
	}

	public boolean deleteCustom(UUID userId, UUID exerciseId) {
		return jdbcTemplate.update(
			"delete from exercises where id = ? and user_id = ?",
			exerciseId,
			userId
		) > 0;
	}

	private ExerciseRow mapRow(ResultSet rs) throws SQLException {
		return new ExerciseRow(
			rs.getObject("id", UUID.class).toString(),
			rs.getObject("user_id", UUID.class),
			rs.getString("name"),
			rs.getString("muscle_group"),
			rs.getString("equipment"),
			rs.getBoolean("is_custom")
		);
	}
}
