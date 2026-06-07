package com.rehanislam.overload.health;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
class HealthController {

	@GetMapping
	HealthResponse health() {
		return new HealthResponse("up", "overload-api", Instant.now());
	}

	record HealthResponse(String status, String service, Instant timestamp) {
	}
}
