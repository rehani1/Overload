package com.rehanislam.overload.workout;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.workout.WorkoutDtos.ExerciseSnapshot;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutExerciseResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutSetResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class WorkoutRepository {

	private final JdbcTemplate jdbcTemplate;

	public WorkoutRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public List<WorkoutResponse> findAll(UUID userId) {
		return jdbcTemplate.query(
			"""
			select id, title, workout_date, notes, status
			from workouts
			where user_id = ?
			order by workout_date desc, created_at desc
			""",
			(rs, rowNum) -> mapWorkout(rs),
			userId
		);
	}

	public Optional<WorkoutResponse> findById(UUID userId, UUID workoutId) {
		List<WorkoutResponse> rows = jdbcTemplate.query(
			"""
			select id, title, workout_date, notes, status
			from workouts
			where id = ? and user_id = ?
			""",
			(rs, rowNum) -> mapWorkout(rs),
			workoutId,
			userId
		);
		return rows.stream().findFirst();
	}

	public WorkoutResponse create(UUID userId, WorkoutWrite workout) {
		UUID workoutId = jdbcTemplate.queryForObject(
			"""
			insert into workouts
			    (user_id, title, workout_date, notes, status)
			values (?, ?, ?, ?, ?)
			returning id
			""",
			UUID.class,
			userId,
			workout.title(),
			workout.date(),
			workout.notes(),
			workout.status()
		);
		replaceExercises(workoutId, workout.exercises());
		return findById(userId, workoutId).orElseThrow();
	}

	public Optional<WorkoutResponse> update(UUID userId, UUID workoutId, WorkoutWrite workout) {
		int updated = jdbcTemplate.update(
			"""
			update workouts
			set title = ?, workout_date = ?, notes = ?, status = ?, updated_at = now()
			where id = ? and user_id = ?
			""",
			workout.title(),
			workout.date(),
			workout.notes(),
			workout.status(),
			workoutId,
			userId
		);
		if (updated == 0) {
			return Optional.empty();
		}
		if (workout.replaceExercises()) {
			replaceExercises(workoutId, workout.exercises());
		}
		return findById(userId, workoutId);
	}

	public boolean delete(UUID userId, UUID workoutId) {
		return jdbcTemplate.update(
			"delete from workouts where id = ? and user_id = ?",
			workoutId,
			userId
		) > 0;
	}

	private void replaceExercises(UUID workoutId, List<WorkoutExerciseWrite> exercises) {
		jdbcTemplate.update("delete from workout_exercises where workout_id = ?", workoutId);
		for (int index = 0; index < exercises.size(); index++) {
			WorkoutExerciseWrite exercise = exercises.get(index);
			UUID workoutExerciseId = jdbcTemplate.queryForObject(
				"""
				insert into workout_exercises
				    (
				        workout_id,
				        exercise_external_id,
				        exercise_name,
				        muscle_group,
				        equipment,
				        exercise_is_custom,
				        notes,
				        position
				    )
				values (?, ?, ?, ?, ?, ?, ?, ?)
				returning id
				""",
				UUID.class,
				workoutId,
				exercise.exercise().id(),
				exercise.exercise().name(),
				exercise.exercise().muscleGroup(),
				exercise.exercise().equipment(),
				exercise.exercise().isCustom(),
				exercise.notes(),
				index
			);
			insertSets(workoutExerciseId, exercise.sets());
		}
	}

	private void insertSets(UUID workoutExerciseId, List<WorkoutSetWrite> sets) {
		for (WorkoutSetWrite set : sets) {
			jdbcTemplate.update(
				"""
				insert into workout_sets
				    (workout_exercise_id, set_number, reps, weight, weight_unit, rpe, is_warmup)
				values (?, ?, ?, ?, ?, ?, ?)
				""",
				workoutExerciseId,
				set.setNumber(),
				set.reps(),
				set.weight(),
				set.weightUnit(),
				set.rpe(),
				set.isWarmup()
			);
		}
	}

	private WorkoutResponse mapWorkout(ResultSet rs) throws SQLException {
		UUID workoutId = rs.getObject("id", UUID.class);
		return new WorkoutResponse(
			workoutId.toString(),
			rs.getString("title"),
			rs.getObject("workout_date", LocalDate.class).toString(),
			findExercises(workoutId),
			rs.getString("notes"),
			rs.getString("status")
		);
	}

	private List<WorkoutExerciseResponse> findExercises(UUID workoutId) {
		return jdbcTemplate.query(
			"""
			select
			    id,
			    exercise_external_id,
			    exercise_name,
			    muscle_group,
			    equipment,
			    exercise_is_custom,
			    notes
			from workout_exercises
			where workout_id = ?
			order by position asc
			""",
			(rs, rowNum) -> {
				UUID workoutExerciseId = rs.getObject("id", UUID.class);
				return new WorkoutExerciseResponse(
					workoutExerciseId.toString(),
					new ExerciseSnapshot(
						rs.getString("exercise_external_id"),
						rs.getString("exercise_name"),
						rs.getString("muscle_group"),
						rs.getString("equipment"),
						rs.getBoolean("exercise_is_custom")
					),
					findSets(workoutExerciseId),
					rs.getString("notes")
				);
			},
			workoutId
		);
	}

	private List<WorkoutSetResponse> findSets(UUID workoutExerciseId) {
		return jdbcTemplate.query(
			"""
			select id, set_number, reps, weight, weight_unit, rpe, is_warmup
			from workout_sets
			where workout_exercise_id = ?
			order by set_number asc
			""",
			(rs, rowNum) -> new WorkoutSetResponse(
				rs.getObject("id", UUID.class).toString(),
				rs.getInt("set_number"),
				rs.getInt("reps"),
				rs.getBigDecimal("weight"),
				rs.getString("weight_unit"),
				rs.getBigDecimal("rpe"),
				rs.getBoolean("is_warmup")
			),
			workoutExerciseId
		);
	}

	public record WorkoutWrite(
		String title,
		LocalDate date,
		List<WorkoutExerciseWrite> exercises,
		String notes,
		String status,
		boolean replaceExercises
	) {
	}

	public record WorkoutExerciseWrite(
		ExerciseWrite exercise,
		List<WorkoutSetWrite> sets,
		String notes
	) {
	}

	public record ExerciseWrite(
		String id,
		String name,
		String muscleGroup,
		String equipment,
		boolean isCustom
	) {
	}

	public record WorkoutSetWrite(
		int setNumber,
		int reps,
		BigDecimal weight,
		String weightUnit,
		BigDecimal rpe,
		boolean isWarmup
	) {
	}
}
