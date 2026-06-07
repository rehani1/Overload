package com.rehanislam.overload.program;

import java.util.List;

import com.rehanislam.overload.program.ProgramDtos.ProgramRequest;
import com.rehanislam.overload.program.ProgramDtos.ProgramResponse;
import com.rehanislam.overload.program.ProgramDtos.ProgramUpdateRequest;
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
@RequestMapping("/api/programs")
public class ProgramController {

	private final ProgramService programService;

	public ProgramController(ProgramService programService) {
		this.programService = programService;
	}

	@GetMapping
	public List<ProgramResponse> findAll(@AuthenticationPrincipal UserPrincipal principal) {
		return programService.findAll(principal.id());
	}

	@GetMapping("/{id}")
	public ProgramResponse findById(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		return programService.findById(principal.id(), id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProgramResponse create(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody ProgramRequest request
	) {
		return programService.create(principal.id(), request);
	}

	@PatchMapping("/{id}")
	public ProgramResponse update(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id,
		@Valid @RequestBody ProgramUpdateRequest request
	) {
		return programService.update(principal.id(), id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(
		@AuthenticationPrincipal UserPrincipal principal,
		@PathVariable String id
	) {
		programService.delete(principal.id(), id);
	}
}
