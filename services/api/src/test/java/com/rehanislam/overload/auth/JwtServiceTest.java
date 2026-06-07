package com.rehanislam.overload.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rehanislam.overload.user.UserEntity;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

	private final Clock clock = Clock.fixed(Instant.parse("2026-06-07T18:00:00Z"), ZoneOffset.UTC);
	private final JwtService jwtService = new JwtService(
		clock,
		new ObjectMapper(),
		"test-secret-that-is-long-enough-for-dev",
		15
	);

	@Test
	void createsAndParsesAccessToken() {
		UUID userId = UUID.randomUUID();
		UserEntity user = new UserEntity();
		user.setId(userId);
		user.setEmail("rehan@example.com");

		String token = jwtService.createAccessToken(user);

		Optional<JwtClaims> claims = jwtService.parseAccessToken(token);
		assertThat(claims).isPresent();
		assertThat(claims.get().userId()).isEqualTo(userId);
		assertThat(claims.get().email()).isEqualTo("rehan@example.com");
		assertThat(claims.get().expiresAt()).isEqualTo(Instant.parse("2026-06-07T18:15:00Z"));
	}

	@Test
	void rejectsTamperedToken() {
		UserEntity user = new UserEntity();
		user.setId(UUID.randomUUID());
		user.setEmail("rehan@example.com");
		String token = jwtService.createAccessToken(user);

		assertThat(jwtService.parseAccessToken(token + "tampered")).isEmpty();
	}
}
