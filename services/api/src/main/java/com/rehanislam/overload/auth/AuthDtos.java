package com.rehanislam.overload.auth;

import java.math.BigDecimal;

import com.rehanislam.overload.user.UserResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

	private AuthDtos() {
	}

	public record AuthResponse(
		UserResponse user,
		String accessToken,
		String refreshToken
	) {
	}

	public record LoginRequest(
		@NotBlank
		@Email
		String email,

		@NotBlank
		String password
	) {
	}

	public record RegisterRequest(
		@NotBlank
		@Email
		String email,

		@NotBlank
		@Size(min = 8, max = 128)
		String password,

		@NotBlank
		@Size(max = 80)
		String firstName,

		@NotBlank
		@Size(max = 80)
		String lastName,

		@NotBlank
		@Size(max = 200)
		String goal,

		@NotNull
		@Min(24)
		@Max(108)
		Integer heightInches,

		@NotBlank
		@Pattern(regexp = "female|male")
		String sex,

		@NotNull
		@DecimalMin(value = "1.0")
		BigDecimal weightPounds,

		@Pattern(regexp = "lb|kg")
		String unitPreference,

		@Valid
		NutritionTargetSetup nutritionTarget
	) {
	}

	public record NutritionTargetSetup(
		@DecimalMin("0.0")
		BigDecimal proteinGrams,

		@DecimalMin("0.0")
		BigDecimal carbsGrams,

		@DecimalMin("0.0")
		BigDecimal fatGrams
	) {
	}

	public record RefreshRequest(
		@NotBlank
		String refreshToken
	) {
	}

	public record LogoutRequest(
		@NotBlank
		String refreshToken
	) {
	}
}
