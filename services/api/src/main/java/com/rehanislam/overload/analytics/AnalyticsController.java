package com.rehanislam.overload.analytics;

import com.rehanislam.overload.analytics.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rehanislam.overload.security.UserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

	private final AnalyticsService analyticsService;

	public AnalyticsController(AnalyticsService analyticsService) {
		this.analyticsService = analyticsService;
	}

	@GetMapping("/summary")
	public AnalyticsSummaryResponse summary(
		@AuthenticationPrincipal UserPrincipal principal,
		@RequestParam(required = false) String from,
		@RequestParam(required = false) String to
	) {
		return analyticsService.summarize(principal.id(), from, to);
	}
}
