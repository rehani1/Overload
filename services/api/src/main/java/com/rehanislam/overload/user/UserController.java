package com.rehanislam.overload.user;

import com.rehanislam.overload.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public UserResponse getMe(@AuthenticationPrincipal UserPrincipal principal) {
		return userService.getMe(principal.id());
	}

	@PatchMapping
	public UserResponse updateMe(
		@AuthenticationPrincipal UserPrincipal principal,
		@Valid @RequestBody UpdateProfileRequest request
	) {
		return userService.updateMe(principal.id(), request);
	}
}
