package com.rehanislam.overload.sync;

import com.rehanislam.overload.security.UserPrincipal;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportRequest;
import com.rehanislam.overload.sync.MobileImportDtos.MobileImportResponse;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import")
public class MobileImportController {

	private final MobileImportService mobileImportService;

	public MobileImportController(MobileImportService mobileImportService) {
		this.mobileImportService = mobileImportService;
	}

	@PostMapping("/mobile")
	public MobileImportResponse importMobile(
		@AuthenticationPrincipal UserPrincipal principal,
		@RequestBody MobileImportRequest request
	) {
		return mobileImportService.importMobileData(principal.id(), request);
	}
}
