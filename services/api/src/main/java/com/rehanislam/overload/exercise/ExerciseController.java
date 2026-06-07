package com.rehanislam.overload.exercise;

import java.util.List;

import com.rehanislam.overload.exercise.ExerciseDtos.ExerciseRequest;
import com.rehanislam.overload.exercise.ExerciseDtos.ExerciseResponse;
import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

	private final ExerciseService exerciseService;

	public ExerciseController(ExerciseService exerciseService) {
		this.exerciseService = exerciseService;
	}

	@GetMapping
	public List<ExerciseResponse> findAll(@AuthenticationPrincipal UserPrincipal principal) {
		return exerciseService.findAll(principal.id());
	}

	@GetMapping("/{id}")
	public ExerciseResponse findById(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		return exerciseService.findById(principal.id(), id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ExerciseResponse create(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody ExerciseRequest request
	) {
		return exerciseService.create(principal.id(), request);
	}

	@PutMapping("/{id}")
	public ExerciseResponse update(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody ExerciseRequest request
	) {
		return exerciseService.update(principal.id(), id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		exerciseService.delete(principal.id(), id);
	}
}
