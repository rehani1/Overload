package com.rehanislam.overload.program;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rehanislam.overload.program.ProgramDtos.ProgramResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProgramRepository {

	private final JdbcTemplate jdbcTemplate;
	private final ObjectMapper objectMapper;

	public ProgramRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
		this.jdbcTemplate = jdbcTemplate;
		this.objectMapper = objectMapper;
	}

	public List<ProgramResponse> findAll(UUID userId) {
		return jdbcTemplate.query(
			"""
			select id, name, goal, notes, days_json, created_at, updated_at
			from programs
			where user_id = ?
			order by created_at desc
			""",
			(rs, rowNum) -> mapProgram(rs),
			userId
		);
	}

	public Optional<ProgramResponse> findById(UUID userId, UUID programId) {
		List<ProgramResponse> rows = jdbcTemplate.query(
			"""
			select id, name, goal, notes, days_json, created_at, updated_at
			from programs
			where user_id = ? and id = ?
			""",
			(rs, rowNum) -> mapProgram(rs),
			userId,
			programId
		);
		return rows.stream().findFirst();
	}

	public ProgramResponse create(UUID userId, ProgramWrite program) {
		return jdbcTemplate.queryForObject(
			"""
			insert into programs
			    (user_id, name, goal, notes, days_json)
			values (?, ?, ?, ?, cast(? as jsonb))
			returning id, name, goal, notes, days_json, created_at, updated_at
			""",
			(rs, rowNum) -> mapProgram(rs),
			userId,
			program.name(),
			program.goal(),
			program.notes(),
			toJson(program.days())
		);
	}

	public Optional<ProgramResponse> update(UUID userId, UUID programId, ProgramWrite program) {
		List<ProgramResponse> rows = jdbcTemplate.query(
			"""
			update programs
			set name = ?, goal = ?, notes = ?, days_json = cast(? as jsonb), updated_at = now()
			where user_id = ? and id = ?
			returning id, name, goal, notes, days_json, created_at, updated_at
			""",
			(rs, rowNum) -> mapProgram(rs),
			program.name(),
			program.goal(),
			program.notes(),
			toJson(program.days()),
			userId,
			programId
		);
		return rows.stream().findFirst();
	}

	public boolean delete(UUID userId, UUID programId) {
		return jdbcTemplate.update(
			"delete from programs where user_id = ? and id = ?",
			userId,
			programId
		) > 0;
	}

	private ProgramResponse mapProgram(ResultSet rs) throws SQLException {
		return new ProgramResponse(
			rs.getObject("id", UUID.class).toString(),
			rs.getString("name"),
			rs.getString("goal"),
			rs.getString("notes"),
			fromJson(rs.getString("days_json")),
			toInstant(rs, "created_at"),
			toInstant(rs, "updated_at")
		);
	}

	private Instant toInstant(ResultSet rs, String column) throws SQLException {
		return rs.getTimestamp(column).toInstant();
	}

	private String toJson(JsonNode value) {
		try {
			return objectMapper.writeValueAsString(value);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Unable to serialize program days.", ex);
		}
	}

	private JsonNode fromJson(String json) {
		try {
			return objectMapper.readTree(json);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Unable to deserialize program days.", ex);
		}
	}

	public record ProgramWrite(
		String name,
		String goal,
		String notes,
		JsonNode days
	) {
	}
}
