package com.rehanislam.overload.exercise;

import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.exercise.ExerciseDtos.ExerciseRequest;
import com.rehanislam.overload.exercise.ExerciseDtos.ExerciseResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExerciseService {

	private final ExerciseRepository exerciseRepository;

	public ExerciseService(ExerciseRepository exerciseRepository) {
		this.exerciseRepository = exerciseRepository;
	}

	@Transactional(readOnly = true)
	public List<ExerciseResponse> findAll(UUID userId) {
		return exerciseRepository.findAllVisibleTo(userId)
			.stream()
			.map(ExerciseResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public ExerciseResponse findById(UUID userId, String id) {
		return ExerciseResponse.from(
			exerciseRepository.findVisibleById(userId, parseUuid(id))
				.orElseThrow(() -> notFound("Exercise not found."))
		);
	}

	@Transactional
	public ExerciseResponse create(UUID userId, ExerciseRequest request) {
		return ExerciseResponse.from(exerciseRepository.create(
			userId,
			normalize(request.name()),
			normalize(request.muscleGroup()),
			normalize(request.equipment())
		));
	}

	@Transactional
	public ExerciseResponse update(UUID userId, String id, ExerciseRequest request) {
		return ExerciseResponse.from(
			exerciseRepository.updateCustom(
				userId,
				parseUuid(id),
				normalize(request.name()),
				normalize(request.muscleGroup()),
				normalize(request.equipment())
			).orElseThrow(() -> notFound("Custom exercise not found."))
		);
	}

	@Transactional
	public void delete(UUID userId, String id) {
		if (!exerciseRepository.deleteCustom(userId, parseUuid(id))) {
			throw notFound("Custom exercise not found.");
		}
	}

	private String normalize(String value) {
		return value.trim();
	}

	private UUID parseUuid(String id) {
		try {
			return UUID.fromString(id);
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found.");
		}
	}

	private ResponseStatusException notFound(String message) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
	}
}
