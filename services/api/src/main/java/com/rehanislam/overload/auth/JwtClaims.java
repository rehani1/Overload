package com.rehanislam.overload.auth;

import java.time.Instant;
import java.util.UUID;

public record JwtClaims(UUID userId, String email, Instant expiresAt) {
}
