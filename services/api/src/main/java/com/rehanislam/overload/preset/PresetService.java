package com.rehanislam.overload.preset;

import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.preset.PresetDtos.MealPresetRequest;
import com.rehanislam.overload.preset.PresetDtos.MealPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.MealPresetUpdateRequest;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetRequest;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetUpdateRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PresetService {

	private final PresetRepository presetRepository;

	public PresetService(PresetRepository presetRepository) {
		this.presetRepository = presetRepository;
	}

	@Transactional(readOnly = true)
	public List<WorkoutPresetResponse> findWorkoutPresets(UUID userId) {
		return presetRepository.findWorkoutPresets(userId);
	}

	@Transactional
	public WorkoutPresetResponse createWorkoutPreset(UUID userId, WorkoutPresetRequest request) {
		return presetRepository.createWorkoutPreset(userId, request.title().trim(), request.workout());
	}

	@Transactional
	public WorkoutPresetResponse importWorkoutPreset(UUID userId, WorkoutPresetResponse preset) {
		String clientImportId = trimToNull(preset.id());
		if (clientImportId != null) {
			var existingPreset = presetRepository.findWorkoutPresetByClientImportId(userId, clientImportId);
			if (existingPreset.isPresent()) {
				return existingPreset.get();
			}
		}
		return presetRepository.createWorkoutPreset(
			userId,
			clientImportId,
			preset.title().trim(),
			preset.workout()
		);
	}

	@Transactional
	public WorkoutPresetResponse updateWorkoutPreset(UUID userId, String id, WorkoutPresetUpdateRequest request) {
		WorkoutPresetResponse existing = presetRepository.findWorkoutPreset(userId, parseUuid(id))
			.orElseThrow(() -> notFound("Workout preset not found."));
		return presetRepository.updateWorkoutPreset(
			userId,
			parseUuid(id),
			request.title() == null ? existing.title() : request.title().trim(),
			request.workout() == null ? existing.workout() : request.workout()
		).orElseThrow(() -> notFound("Workout preset not found."));
	}

	@Transactional
	public void deleteWorkoutPreset(UUID userId, String id) {
		if (!presetRepository.deleteWorkoutPreset(userId, parseUuid(id))) {
			throw notFound("Workout preset not found.");
		}
	}

	@Transactional(readOnly = true)
	public List<MealPresetResponse> findMealPresets(UUID userId) {
		return presetRepository.findMealPresets(userId);
	}

	@Transactional
	public MealPresetResponse createMealPreset(UUID userId, MealPresetRequest request) {
		return presetRepository.createMealPreset(userId, request.foodName().trim(), request.entry());
	}

	@Transactional
	public MealPresetResponse importMealPreset(UUID userId, MealPresetResponse preset) {
		String clientImportId = trimToNull(preset.id());
		if (clientImportId != null) {
			var existingPreset = presetRepository.findMealPresetByClientImportId(userId, clientImportId);
			if (existingPreset.isPresent()) {
				return existingPreset.get();
			}
		}
		return presetRepository.createMealPreset(
			userId,
			clientImportId,
			preset.foodName().trim(),
			preset.entry()
		);
	}

	@Transactional
	public MealPresetResponse updateMealPreset(UUID userId, String id, MealPresetUpdateRequest request) {
		MealPresetResponse existing = presetRepository.findMealPreset(userId, parseUuid(id))
			.orElseThrow(() -> notFound("Meal preset not found."));
		return presetRepository.updateMealPreset(
			userId,
			parseUuid(id),
			request.foodName() == null ? existing.foodName() : request.foodName().trim(),
			request.entry() == null ? existing.entry() : request.entry()
		).orElseThrow(() -> notFound("Meal preset not found."));
	}

	@Transactional
	public void deleteMealPreset(UUID userId, String id) {
		if (!presetRepository.deleteMealPreset(userId, parseUuid(id))) {
			throw notFound("Meal preset not found.");
		}
	}

	private UUID parseUuid(String id) {
		try {
			return UUID.fromString(id);
		} catch (IllegalArgumentException ex) {
			throw notFound("Preset not found.");
		}
	}

	private ResponseStatusException notFound(String message) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
	}

	private String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
