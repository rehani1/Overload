package com.rehanislam.overload.user;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public UserResponse getMe(UUID userId) {
		return UserResponse.from(findUser(userId));
	}

	@Transactional
	public UserResponse updateMe(UUID userId, UpdateProfileRequest request) {
		UserEntity user = findUser(userId);

		if (request.goal() != null) {
			user.setGoal(request.goal().trim());
		}
		if (request.heightInches() != null) {
			user.setHeightInches(request.heightInches());
		}
		if (request.sex() != null) {
			user.setSex(request.sex());
		}
		if (request.unitPreference() != null) {
			user.setUnitPreference(request.unitPreference());
		}
		if (request.weightPounds() != null) {
			user.setWeightPounds(scale(request.weightPounds()));
		}

		return UserResponse.from(user);
	}

	private UserEntity findUser(UUID userId) {
		return userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists."));
	}

	private BigDecimal scale(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}
}
