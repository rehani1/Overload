package com.rehanislam.overload.workout;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.workout.WorkoutDtos.CreateWorkoutRequest;
import com.rehanislam.overload.workout.WorkoutDtos.ExerciseInput;
import com.rehanislam.overload.workout.WorkoutDtos.UpdateWorkoutRequest;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutExerciseRequest;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutSetRequest;
import com.rehanislam.overload.workout.WorkoutRepository.ExerciseWrite;
import com.rehanislam.overload.workout.WorkoutRepository.WorkoutExerciseWrite;
import com.rehanislam.overload.workout.WorkoutRepository.WorkoutSetWrite;
import com.rehanislam.overload.workout.WorkoutRepository.WorkoutWrite;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkoutService {

	private final WorkoutRepository workoutRepository;

	public WorkoutService(WorkoutRepository workoutRepository) {
		this.workoutRepository = workoutRepository;
	}

	@Transactional(readOnly = true)
	public List<WorkoutResponse> findAll(UUID userId) {
		return workoutRepository.findAll(userId);
	}

	@Transactional(readOnly = true)
	public WorkoutResponse findById(UUID userId, String id) {
		return workoutRepository.findById(userId, parseUuid(id))
			.orElseThrow(() -> notFound("Workout not found."));
	}

	@Transactional
	public WorkoutResponse create(UUID userId, CreateWorkoutRequest request) {
		return workoutRepository.create(userId, new WorkoutWrite(
			request.title().trim(),
			parseDate(request.date()),
			normalizeExercises(request.exercises()),
			trimToNull(request.notes()),
			request.status() == null ? "completed" : request.status(),
			true
		));
	}

	@Transactional
	public WorkoutResponse update(UUID userId, String id, UpdateWorkoutRequest request) {
		WorkoutResponse existing = findById(userId, id);
		List<WorkoutExerciseWrite> exercises = request.exercises() == null
			? List.of()
			: normalizeExercises(request.exercises());
		WorkoutWrite workout = new WorkoutWrite(
			request.title() == null ? existing.title() : request.title().trim(),
			request.date() == null ? parseDate(existing.date()) : parseDate(request.date()),
			exercises,
			request.notes() == null ? existing.notes() : trimToNull(request.notes()),
			request.status() == null ? existing.status() : request.status(),
			request.exercises() != null
		);

		return workoutRepository.update(userId, parseUuid(id), workout)
			.orElseThrow(() -> notFound("Workout not found."));
	}

	@Transactional
	public void delete(UUID userId, String id) {
		if (!workoutRepository.delete(userId, parseUuid(id))) {
			throw notFound("Workout not found.");
		}
	}

	private List<WorkoutExerciseWrite> normalizeExercises(List<WorkoutExerciseRequest> exercises) {
		return (exercises == null ? List.<WorkoutExerciseRequest>of() : exercises)
			.stream()
			.map(this::normalizeExercise)
			.toList();
	}

	private WorkoutExerciseWrite normalizeExercise(WorkoutExerciseRequest request) {
		ExerciseInput exercise = request.exercise();
		if (exercise == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workout exercise is missing exercise details.");
		}
		return new WorkoutExerciseWrite(
			new ExerciseWrite(
				trimToDefault(exercise.id(), UUID.randomUUID().toString()),
				exercise.name().trim(),
				exercise.muscleGroup().trim(),
				exercise.equipment().trim(),
				exercise.isCustom() == null || exercise.isCustom()
			),
			normalizeSets(request.sets()),
			trimToNull(request.notes())
		);
	}

	private List<WorkoutSetWrite> normalizeSets(List<WorkoutSetRequest> sets) {
		List<WorkoutSetRequest> safeSets = sets == null ? List.of() : sets;
		return java.util.stream.IntStream.range(0, safeSets.size())
			.mapToObj(index -> normalizeSet(safeSets.get(index), index + 1))
			.toList();
	}

	private WorkoutSetWrite normalizeSet(WorkoutSetRequest request, int fallbackSetNumber) {
		return new WorkoutSetWrite(
			request.setNumber() == null ? fallbackSetNumber : request.setNumber(),
			request.reps() == null ? 0 : request.reps(),
			scale(request.weight() == null ? BigDecimal.ZERO : request.weight()),
			request.weightUnit() == null ? "lb" : request.weightUnit(),
			request.rpe() == null ? null : scale(request.rpe()),
			Boolean.TRUE.equals(request.isWarmup())
		);
	}

	private LocalDate parseDate(String value) {
		try {
			String trimmed = value.trim();
			return LocalDate.parse(trimmed.length() >= 10 ? trimmed.substring(0, 10) : trimmed);
		} catch (RuntimeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an ISO date for workout date.");
		}
	}

	private UUID parseUuid(String id) {
		try {
			return UUID.fromString(id);
		} catch (IllegalArgumentException ex) {
			throw notFound("Workout not found.");
		}
	}

	private BigDecimal scale(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}

	private String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}

	private String trimToDefault(String value, String defaultValue) {
		if (value == null || value.trim().isEmpty()) {
			return defaultValue;
		}
		return value.trim();
	}

	private ResponseStatusException notFound(String message) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
	}
}
