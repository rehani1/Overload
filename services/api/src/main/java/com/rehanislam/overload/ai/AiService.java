package com.rehanislam.overload.ai;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.rehanislam.overload.ai.AiDtos.AiChatRequest;
import com.rehanislam.overload.ai.AiDtos.AiChatResponse;
import com.rehanislam.overload.user.UserResponse;
import com.rehanislam.overload.user.UserService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiService {

	private final String apiKey;
	private final int maxOutputTokens;
	private final String model;
	private final RestClient restClient;
	private final UserService userService;

	public AiService(
		RestClient.Builder restClientBuilder,
		UserService userService,
		@Value("${overload.ai.openai.api-key}") String apiKey,
		@Value("${overload.ai.openai.model}") String model,
		@Value("${overload.ai.openai.base-url}") String baseUrl,
		@Value("${overload.ai.openai.max-output-tokens}") int maxOutputTokens
	) {
		this.apiKey = apiKey == null ? "" : apiKey.trim();
		this.maxOutputTokens = maxOutputTokens;
		this.model = model;
		this.restClient = restClientBuilder
			.baseUrl(baseUrl)
			.defaultHeader(HttpHeaders.ACCEPT, "application/json")
			.defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
			.build();
		this.userService = userService;
	}

	public AiChatResponse chat(UUID userId, AiChatRequest request) {
		if (apiKey.isBlank()) {
			throw new ResponseStatusException(
				HttpStatus.SERVICE_UNAVAILABLE,
				"OpenAI API key is not configured. Set OPENAI_API_KEY in services/api/.env."
			);
		}

		UserResponse user = userService.getMe(userId);
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("model", model);
		body.put("max_output_tokens", maxOutputTokens);
		body.put("input", toOpenAiInput(user, request));

		JsonNode response = callOpenAi(body);
		String outputText = extractOutputText(response);

		if (outputText.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response.");
		}

		return new AiChatResponse(outputText, model);
	}

	private JsonNode callOpenAi(Map<String, Object> body) {
		try {
			return restClient.post()
				.uri("/responses")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
				.body(body)
				.retrieve()
				.body(JsonNode.class);
		} catch (RestClientResponseException ex) {
			throw new ResponseStatusException(
				HttpStatus.BAD_GATEWAY,
				"OpenAI request failed.",
				ex
			);
		}
	}

	private List<Map<String, String>> toOpenAiInput(UserResponse user, AiChatRequest request) {
		List<Map<String, String>> input = new ArrayList<>();
		input.add(message("developer", systemPrompt(user)));
		request.messages().forEach(message -> input.add(message(message.role(), message.content().trim())));

		return input;
	}

	private Map<String, String> message(String role, String content) {
		return Map.of(
			"role", role,
			"content", content
		);
	}

	private String systemPrompt(UserResponse user) {
		return """
			You are Overload AI, a concise fitness planning assistant inside the Overload app.
			Use the user's profile context when relevant, but do not claim to inspect data that was not provided in the chat.
			Focus on practical training, nutrition, recovery, and planning guidance.
			Avoid medical diagnosis and tell the user to consult a qualified professional for medical issues.

			User profile:
			- Goal: %s
			- Height: %d inches
			- Body weight: %s lb
			- Sex: %s
			- Preferred unit: %s
			""".formatted(
			user.goal(),
			user.heightInches(),
			user.weightPounds(),
			user.sex(),
			user.unitPreference()
		);
	}

	private String extractOutputText(JsonNode response) {
		if (response == null) {
			return "";
		}

		JsonNode outputText = response.get("output_text");
		if (outputText != null && outputText.isTextual()) {
			return outputText.asText().trim();
		}

		JsonNode output = response.get("output");
		if (output == null || !output.isArray()) {
			return "";
		}

		StringBuilder builder = new StringBuilder();
		output.forEach(item -> {
			JsonNode content = item.get("content");
			if (content != null && content.isArray()) {
				content.forEach(part -> {
					JsonNode text = part.get("text");
					if (text != null && text.isTextual()) {
						if (builder.length() > 0) {
							builder.append("\n\n");
						}
						builder.append(text.asText().trim());
					}
				});
			}
		});

		return builder.toString().trim();
	}
}
