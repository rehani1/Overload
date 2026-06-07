package com.rehanislam.overload.workout;

import java.util.List;

import com.rehanislam.overload.security.UserPrincipal;
import com.rehanislam.overload.workout.WorkoutDtos.CreateWorkoutRequest;
import com.rehanislam.overload.workout.WorkoutDtos.UpdateWorkoutRequest;
import com.rehanislam.overload.workout.WorkoutDtos.WorkoutResponse;

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
@RequestMapping("/api/workouts")
public class WorkoutController {

	private final WorkoutService workoutService;

	public WorkoutController(WorkoutService workoutService) {
		this.workoutService = workoutService;
	}

	@GetMapping
	public List<WorkoutResponse> findAll(@AuthenticationPrincipal UserPrincipal principal) {
		return workoutService.findAll(principal.id());
	}

	@GetMapping("/{id}")
	public WorkoutResponse findById(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		return workoutService.findById(principal.id(), id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public WorkoutResponse create(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody CreateWorkoutRequest request
	) {
		return workoutService.create(principal.id(), request);
	}

	@PatchMapping("/{id}")
	public WorkoutResponse update(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody UpdateWorkoutRequest request
	) {
		return workoutService.update(principal.id(), id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		workoutService.delete(principal.id(), id);
	}
}
