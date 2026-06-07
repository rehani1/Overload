package com.rehanislam.overload.user;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
	@Size(min = 1, max = 200)
	String goal,

	@Min(24)
	@Max(108)
	Integer heightInches,

	@Pattern(regexp = "female|male")
	String sex,

	@Pattern(regexp = "lb|kg")
	String unitPreference,

	@DecimalMin(value = "1.0")
	BigDecimal weightPounds
) {
}
