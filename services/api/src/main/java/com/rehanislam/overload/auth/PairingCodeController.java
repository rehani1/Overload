package com.rehanislam.overload.auth;

import com.rehanislam.overload.auth.AuthDtos.AuthResponse;
import com.rehanislam.overload.auth.PairingDtos.ClaimPairingCodeRequest;
import com.rehanislam.overload.auth.PairingDtos.PairingCodeResponse;
import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PairingCodeController {

	private final PairingCodeService pairingCodeService;

	public PairingCodeController(PairingCodeService pairingCodeService) {
		this.pairingCodeService = pairingCodeService;
	}

	@PostMapping({ "/pairing-codes", "/auth/pairing-codes" })
	public PairingCodeResponse create(@AuthenticationPrincipal UserPrincipal principal) {
		return pairingCodeService.create(principal.id());
	}

	@PostMapping("/auth/pairing-codes/claim")
	public AuthResponse claim(@Valid @RequestBody ClaimPairingCodeRequest request) {
		return pairingCodeService.claim(request.code());
	}
}
