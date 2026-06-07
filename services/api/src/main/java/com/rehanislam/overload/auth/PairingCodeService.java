package com.rehanislam.overload.auth;

import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.auth.AuthDtos.AuthResponse;
import com.rehanislam.overload.auth.PairingDtos.PairingCodeResponse;
import com.rehanislam.overload.user.UserEntity;
import com.rehanislam.overload.user.UserRepository;
import com.rehanislam.overload.user.UserResponse;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PairingCodeService {

	private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
	private static final int CODE_LENGTH = 8;
	private static final long PAIRING_CODE_SECONDS = 5 * 60;

	private final Clock clock;
	private final JdbcTemplate jdbcTemplate;
	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;
	private final SecureRandom secureRandom;
	private final UserRepository userRepository;

	public PairingCodeService(
		Clock clock,
		JdbcTemplate jdbcTemplate,
		JwtService jwtService,
		RefreshTokenService refreshTokenService,
		UserRepository userRepository
	) {
		this.clock = clock;
		this.jdbcTemplate = jdbcTemplate;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
		this.secureRandom = new SecureRandom();
		this.userRepository = userRepository;
	}

	@Transactional
	public PairingCodeResponse create(UUID userId) {
		String code = generateCode();
		Instant expiresAt = clock.instant().plusSeconds(PAIRING_CODE_SECONDS);
		jdbcTemplate.update(
			"""
			insert into auth_pairing_codes (user_id, code_hash, expires_at)
			values (?, ?, ?)
			""",
			userId,
			hash(code),
			expiresAt
		);
		return new PairingCodeResponse(code, expiresAt);
	}

	@Transactional
	public AuthResponse claim(String rawCode) {
		String code = normalizeCode(rawCode);
		PairingCode pairingCode = findPairingCode(code);

		if (pairingCode == null || pairingCode.claimedAt() != null || !pairingCode.expiresAt().isAfter(clock.instant())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Pairing code is invalid or expired.");
		}

		jdbcTemplate.update(
			"update auth_pairing_codes set claimed_at = now() where id = ?",
			pairingCode.id()
		);

		UserEntity user = userRepository.findById(pairingCode.userId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Pairing code is invalid or expired."));
		return new AuthResponse(
			UserResponse.from(user),
			jwtService.createAccessToken(user),
			refreshTokenService.create(user)
		);
	}

	private PairingCode findPairingCode(String code) {
		List<PairingCode> rows = jdbcTemplate.query(
			"""
			select id, user_id, expires_at, claimed_at
			from auth_pairing_codes
			where code_hash = ?
			for update
			""",
			(rs, rowNum) -> mapPairingCode(rs),
			hash(code)
		);
		return rows.stream().findFirst().orElse(null);
	}

	private PairingCode mapPairingCode(ResultSet rs) throws SQLException {
		var claimedAt = rs.getTimestamp("claimed_at");
		return new PairingCode(
			rs.getObject("id", UUID.class),
			rs.getObject("user_id", UUID.class),
			rs.getTimestamp("expires_at").toInstant(),
			claimedAt == null ? null : claimedAt.toInstant()
		);
	}

	private String generateCode() {
		StringBuilder code = new StringBuilder(CODE_LENGTH);
		for (int index = 0; index < CODE_LENGTH; index += 1) {
			code.append(CODE_ALPHABET[secureRandom.nextInt(CODE_ALPHABET.length)]);
		}
		return code.toString();
	}

	private String normalizeCode(String code) {
		return code.trim()
			.replaceAll("[^A-Za-z0-9]", "")
			.toUpperCase();
	}

	private String hash(String code) {
		return TokenHash.sha256Hex(normalizeCode(code));
	}

	record PairingCode(
		UUID id,
		UUID userId,
		Instant expiresAt,
		Instant claimedAt
	) {
	}
}
