package com.rehanislam.overload.ai;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AiDtos {

	private AiDtos() {
	}

	public record AiChatRequest(
		@NotEmpty
		@Size(max = 12)
		List<@Valid AiChatMessage> messages
	) {
	}

	public record AiChatMessage(
		@NotBlank
		@Pattern(regexp = "user|assistant")
		String role,

		@NotBlank
		@Size(max = 4000)
		String content
	) {
	}

	public record AiChatResponse(
		String message,
		String model
	) {
	}
}
