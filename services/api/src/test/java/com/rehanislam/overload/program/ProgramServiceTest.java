package com.rehanislam.overload.program;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rehanislam.overload.program.ProgramDtos.ProgramRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProgramServiceTest {

	@Mock
	private ProgramRepository programRepository;

	@InjectMocks
	private ProgramService programService;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void createRejectsNonArrayDays() throws Exception {
		ProgramRequest request = new ProgramRequest(
			"Hypertrophy Block",
			"Build muscle",
			null,
			objectMapper.readTree("{\"day\":1}")
		);

		assertThatThrownBy(() -> programService.create(UUID.randomUUID(), request))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("400");
	}
}
