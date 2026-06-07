package com.rehanislam.overload.auth;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rehanislam.overload.user.UserEntity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	private final Clock clock;
	private final ObjectMapper objectMapper;
	private final byte[] secret;
	private final long accessTokenSeconds;

	public JwtService(
		Clock clock,
		ObjectMapper objectMapper,
		@Value("${overload.security.jwt-secret}") String jwtSecret,
		@Value("${overload.security.access-token-minutes}") long accessTokenMinutes
	) {
		this.clock = clock;
		this.objectMapper = objectMapper;
		this.secret = jwtSecret.getBytes(StandardCharsets.UTF_8);
		this.accessTokenSeconds = accessTokenMinutes * 60;
	}

	public String createAccessToken(UserEntity user) {
		Instant now = clock.instant();
		Instant expiresAt = now.plusSeconds(accessTokenSeconds);
		Map<String, Object> header = Map.of(
			"alg", "HS256",
			"typ", "JWT"
		);
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("sub", user.getId().toString());
		payload.put("email", user.getEmail());
		payload.put("iat", now.getEpochSecond());
		payload.put("exp", expiresAt.getEpochSecond());

		String signingInput = encodeJson(header) + "." + encodeJson(payload);
		return signingInput + "." + sign(signingInput);
	}

	public Optional<JwtClaims> parseAccessToken(String token) {
		try {
			String[] parts = token.split("\\.");
			if (parts.length != 3) {
				return Optional.empty();
			}

			String signingInput = parts[0] + "." + parts[1];
			if (!constantTimeEquals(sign(signingInput), parts[2])) {
				return Optional.empty();
			}

			Map<String, Object> payload = objectMapper.readValue(
				BASE64_URL_DECODER.decode(parts[1]),
				MAP_TYPE
			);
			Instant expiresAt = Instant.ofEpochSecond(asLong(payload.get("exp")));
			if (!expiresAt.isAfter(clock.instant())) {
				return Optional.empty();
			}

			return Optional.of(new JwtClaims(
				UUID.fromString(asString(payload.get("sub"))),
				asString(payload.get("email")),
				expiresAt
			));
		} catch (RuntimeException | java.io.IOException ex) {
			return Optional.empty();
		}
	}

	private String encodeJson(Map<String, Object> value) {
		try {
			return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
		} catch (java.io.IOException ex) {
			throw new IllegalStateException("Unable to encode JWT.", ex);
		}
	}

	private String sign(String signingInput) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret, "HmacSHA256"));
			return BASE64_URL_ENCODER.encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception ex) {
			throw new IllegalStateException("Unable to sign JWT.", ex);
		}
	}

	private boolean constantTimeEquals(String expected, String actual) {
		return java.security.MessageDigest.isEqual(
			expected.getBytes(StandardCharsets.UTF_8),
			actual.getBytes(StandardCharsets.UTF_8)
		);
	}

	private String asString(Object value) {
		if (value instanceof String stringValue && !stringValue.isBlank()) {
			return stringValue;
		}
		throw new IllegalArgumentException("JWT claim is missing.");
	}

	private long asLong(Object value) {
		if (value instanceof Number numberValue) {
			return numberValue.longValue();
		}
		throw new IllegalArgumentException("JWT claim is missing.");
	}
}
