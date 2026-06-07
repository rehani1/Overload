package com.rehanislam.overload.auth;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

public final class PairingDtos {

	private PairingDtos() {
	}

	public record PairingCodeResponse(
		String code,
		Instant expiresAt
	) {
	}

	public record ClaimPairingCodeRequest(
		@NotBlank
		String code
	) {
	}
}
