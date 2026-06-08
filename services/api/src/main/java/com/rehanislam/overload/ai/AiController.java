package com.rehanislam.overload.ai;

import com.rehanislam.overload.ai.AiDtos.AiChatRequest;
import com.rehanislam.overload.ai.AiDtos.AiChatResponse;
import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

	private final AiService aiService;

	public AiController(AiService aiService) {
		this.aiService = aiService;
	}

	@PostMapping("/chat")
	public AiChatResponse chat(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody AiChatRequest request
	) {
		return aiService.chat(principal.id(), request);
	}
}
