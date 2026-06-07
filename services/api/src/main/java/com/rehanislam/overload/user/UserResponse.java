package com.rehanislam.overload.user;

import java.math.BigDecimal;

public record UserResponse(
	String id,
	String email,
	String firstName,
	String lastName,
	String goal,
	int heightInches,
	String sex,
	String unitPreference,
	BigDecimal weightPounds
) {
	public static UserResponse from(UserEntity user) {
		return new UserResponse(
			user.getId().toString(),
			user.getEmail(),
			user.getFirstName(),
			user.getLastName(),
			user.getGoal(),
			user.getHeightInches(),
			user.getSex(),
			user.getUnitPreference(),
			user.getWeightPounds()
		);
	}
}
