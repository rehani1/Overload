package com.rehanislam.overload.nutrition;

import java.util.List;

import com.rehanislam.overload.nutrition.NutritionDtos.CreateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionTargetRequest;
import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionController {

	private final NutritionService nutritionService;

	public NutritionController(NutritionService nutritionService) {
		this.nutritionService = nutritionService;
	}

	@GetMapping("/entries")
	public List<NutritionEntryResponse> findEntries(
		@AuthenticationPrincipal UserPrincipal principal,
		@RequestParam(required = false) String date
	) {
		return nutritionService.findEntries(principal.id(), date);
	}

	@PostMapping("/entries")
	@ResponseStatus(HttpStatus.CREATED)
	public NutritionEntryResponse createEntry(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody CreateNutritionEntryRequest request
	) {
		return nutritionService.createEntry(principal.id(), request);
	}

	@PatchMapping("/entries/{id}")
	public NutritionEntryResponse updateEntry(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody UpdateNutritionEntryRequest request
	) {
		return nutritionService.updateEntry(principal.id(), id, request);
	}

	@DeleteMapping("/entries/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteEntry(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		nutritionService.deleteEntry(principal.id(), id);
	}

	@GetMapping("/target")
	public NutritionTargetResponse getTarget(@AuthenticationPrincipal UserPrincipal principal) {
		return nutritionService.getTarget(principal.id());
	}

	@PutMapping("/target")
	public NutritionTargetResponse updateTarget(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody UpdateNutritionTargetRequest request
	) {
		return nutritionService.updateTarget(principal.id(), request);
	}
}
