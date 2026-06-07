package com.rehanislam.overload.preset;

import java.util.List;

import com.rehanislam.overload.preset.PresetDtos.MealPresetRequest;
import com.rehanislam.overload.preset.PresetDtos.MealPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.MealPresetUpdateRequest;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetRequest;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetResponse;
import com.rehanislam.overload.preset.PresetDtos.WorkoutPresetUpdateRequest;
import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presets")
public class PresetController {

	private final PresetService presetService;

	public PresetController(PresetService presetService) {
		this.presetService = presetService;
	}

	@GetMapping("/workouts")
	public List<WorkoutPresetResponse> findWorkoutPresets(@AuthenticationPrincipal UserPrincipal principal) {
		return presetService.findWorkoutPresets(principal.id());
	}

	@PostMapping("/workouts")
	@ResponseStatus(HttpStatus.CREATED)
	public WorkoutPresetResponse createWorkoutPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody WorkoutPresetRequest request
	) {
		return presetService.createWorkoutPreset(principal.id(), request);
	}

	@PatchMapping("/workouts/{id}")
	public WorkoutPresetResponse updateWorkoutPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody WorkoutPresetUpdateRequest request
	) {
		return presetService.updateWorkoutPreset(principal.id(), id, request);
	}

	@DeleteMapping("/workouts/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteWorkoutPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		presetService.deleteWorkoutPreset(principal.id(), id);
	}

	@GetMapping("/meals")
	public List<MealPresetResponse> findMealPresets(@AuthenticationPrincipal UserPrincipal principal) {
		return presetService.findMealPresets(principal.id());
	}

	@PostMapping("/meals")
	@ResponseStatus(HttpStatus.CREATED)
	public MealPresetResponse createMealPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody MealPresetRequest request
	) {
		return presetService.createMealPreset(principal.id(), request);
	}

	@PatchMapping("/meals/{id}")
	public MealPresetResponse updateMealPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody MealPresetUpdateRequest request
	) {
		return presetService.updateMealPreset(principal.id(), id, request);
	}

	@DeleteMapping("/meals/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteMealPreset(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		presetService.deleteMealPreset(principal.id(), id);
	}
}
