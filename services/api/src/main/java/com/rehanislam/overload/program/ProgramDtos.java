package com.rehanislam.overload.program;

import java.time.Instant;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ProgramDtos {

	private ProgramDtos() {
	}

	public record ProgramResponse(
		String id,
		String name,
		String goal,
		String notes,
		JsonNode days,
		Instant createdAt,
		Instant updatedAt
	) {
	}

	public record ProgramRequest(
		@NotBlank
		@Size(max = 160)
		String name,

		@NotBlank
		@Size(max = 200)
		String goal,

		String notes,

		@NotNull
		JsonNode days
	) {
	}

	public record ProgramUpdateRequest(
		@Size(min = 1, max = 160)
		String name,

		@Size(min = 1, max = 200)
		String goal,

		String notes,

		JsonNode days
	) {
	}
}
