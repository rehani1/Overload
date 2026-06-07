package com.rehanislam.overload.auth;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;

import com.rehanislam.overload.user.UserEntity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RefreshTokenService {

	private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
	private final Clock clock;
	private final RefreshTokenRepository refreshTokenRepository;
	private final SecureRandom secureRandom;
	private final long refreshTokenSeconds;

	public RefreshTokenService(
		Clock clock,
		RefreshTokenRepository refreshTokenRepository,
		@Value("${overload.security.refresh-token-days}") long refreshTokenDays
	) {
		this.clock = clock;
		this.refreshTokenRepository = refreshTokenRepository;
		this.refreshTokenSeconds = refreshTokenDays * 24 * 60 * 60;
		this.secureRandom = new SecureRandom();
	}

	@Transactional
	public String create(UserEntity user) {
		String token = generateToken();
		refreshTokenRepository.save(new RefreshTokenEntity(
			user,
			TokenHash.sha256Hex(token),
			clock.instant().plusSeconds(refreshTokenSeconds)
		));
		return token;
	}

	@Transactional
	public RefreshTokenIssue rotate(String refreshToken) {
		RefreshTokenEntity existingToken = refreshTokenRepository.findByTokenHash(TokenHash.sha256Hex(refreshToken))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid."));

		if (!existingToken.isActive(clock.instant())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked.");
		}

		existingToken.revoke();
		String nextToken = create(existingToken.getUser());
		return new RefreshTokenIssue(existingToken.getUser(), nextToken);
	}

	@Transactional
	public void revoke(String refreshToken) {
		refreshTokenRepository.findByTokenHash(TokenHash.sha256Hex(refreshToken))
			.ifPresent(RefreshTokenEntity::revoke);
	}

	private String generateToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return encoder.encodeToString(bytes);
	}

	public record RefreshTokenIssue(UserEntity user, String refreshToken) {
	}
}
