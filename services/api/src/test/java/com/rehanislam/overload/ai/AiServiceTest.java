package com.rehanislam.overload.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.ai.AiDtos.AiChatMessage;
import com.rehanislam.overload.ai.AiDtos.AiChatRequest;
import com.rehanislam.overload.ai.AiDtos.AiChatResponse;
import com.rehanislam.overload.user.UserResponse;
import com.rehanislam.overload.user.UserService;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class AiServiceTest {

	private static final UUID USER_ID = UUID.randomUUID();

	@Test
	void rejectsChatWhenOpenAiKeyIsMissing() {
		UserService userService = mock(UserService.class);
		AiService aiService = new AiService(
			RestClient.builder(),
			userService,
			"",
			"gpt-5.4-mini",
			"https://api.openai.test/v1",
			600
		);

		assertThatThrownBy(() -> aiService.chat(USER_ID, request("How should I train?")))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("503");
		verifyNoInteractions(userService);
	}

	@Test
	void sendsChatToOpenAiResponsesApi() {
		RestClient.Builder restClientBuilder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
		UserService userService = mock(UserService.class);
		when(userService.getMe(USER_ID)).thenReturn(user());
		AiService aiService = new AiService(
			restClientBuilder,
			userService,
			"sk-test",
			"gpt-5.4-mini",
			"https://api.openai.test/v1",
			600
		);
		server.expect(requestTo("https://api.openai.test/v1/responses"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer sk-test"))
			.andRespond(withSuccess("{\"output_text\":\"Add one hard set per week.\"}", MediaType.APPLICATION_JSON));

		AiChatResponse response = aiService.chat(USER_ID, request("How should I progress?"));

		assertThat(response.message()).isEqualTo("Add one hard set per week.");
		assertThat(response.model()).isEqualTo("gpt-5.4-mini");
		server.verify();
	}

	private AiChatRequest request(String content) {
		return new AiChatRequest(List.of(new AiChatMessage("user", content)));
	}

	private UserResponse user() {
		return new UserResponse(
			USER_ID.toString(),
			"rehan@example.com",
			"Rehan",
			"Islam",
			"Build strength",
			70,
			"male",
			"lb",
			new BigDecimal("185.00")
		);
	}
}
