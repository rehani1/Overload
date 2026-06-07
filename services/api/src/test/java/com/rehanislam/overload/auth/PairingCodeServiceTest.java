package com.rehanislam.overload.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.user.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PairingCodeServiceTest {

	@Mock
	private JdbcTemplate jdbcTemplate;

	@Mock
	private JwtService jwtService;

	@Mock
	private RefreshTokenService refreshTokenService;

	@Mock
	private UserRepository userRepository;

	private final Clock clock = Clock.fixed(Instant.parse("2026-06-07T12:00:00Z"), ZoneOffset.UTC);

	@Test
	void createStoresHashedShortLivedCode() {
		PairingCodeService service = new PairingCodeService(
			clock,
			jdbcTemplate,
			jwtService,
			refreshTokenService,
			userRepository
		);
		UUID userId = UUID.randomUUID();

		PairingDtos.PairingCodeResponse response = service.create(userId);

		assertThat(response.code()).hasSize(8);
		assertThat(response.expiresAt()).isEqualTo(Instant.parse("2026-06-07T12:05:00Z"));
		verify(jdbcTemplate).update(
			anyString(),
			eq(userId),
			eq(TokenHash.sha256Hex(response.code())),
			eq(response.expiresAt())
		);
	}

	@Test
	void claimRejectsUnknownCode() {
		PairingCodeService service = new PairingCodeService(
			clock,
			jdbcTemplate,
			jwtService,
			refreshTokenService,
			userRepository
		);
		when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<PairingCodeService.PairingCode>>any(), anyString()))
			.thenReturn(List.of());

		assertThatThrownBy(() -> service.claim("missing"))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("401");
	}
}
