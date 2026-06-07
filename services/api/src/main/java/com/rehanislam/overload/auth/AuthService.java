package com.rehanislam.overload.auth;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.rehanislam.overload.auth.AuthDtos.AuthResponse;
import com.rehanislam.overload.auth.AuthDtos.LoginRequest;
import com.rehanislam.overload.auth.AuthDtos.NutritionTargetSetup;
import com.rehanislam.overload.auth.AuthDtos.RegisterRequest;
import com.rehanislam.overload.user.UserEntity;
import com.rehanislam.overload.user.UserRepository;
import com.rehanislam.overload.user.UserResponse;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

	private static final BigDecimal DEFAULT_PROTEIN_GRAMS = new BigDecimal("160.00");
	private static final BigDecimal DEFAULT_CARBS_GRAMS = new BigDecimal("250.00");
	private static final BigDecimal DEFAULT_FAT_GRAMS = new BigDecimal("70.00");

	private final JdbcTemplate jdbcTemplate;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final RefreshTokenService refreshTokenService;
	private final UserRepository userRepository;

	public AuthService(
		JdbcTemplate jdbcTemplate,
		JwtService jwtService,
		PasswordEncoder passwordEncoder,
		RefreshTokenService refreshTokenService,
		UserRepository userRepository
	) {
		this.jdbcTemplate = jdbcTemplate;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.refreshTokenService = refreshTokenService;
		this.userRepository = userRepository;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for that email.");
		}

		UserEntity user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setFirstName(request.firstName().trim());
		user.setLastName(request.lastName().trim());
		user.setGoal(request.goal().trim());
		user.setHeightInches(request.heightInches());
		user.setSex(request.sex());
		user.setUnitPreference(normalizeUnitPreference(request.unitPreference()));
		user.setWeightPounds(scale(request.weightPounds()));

		UserEntity savedUser = userRepository.saveAndFlush(user);
		createInitialNutritionTarget(savedUser, request.nutritionTarget());

		return issueAuthResponse(savedUser);
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		UserEntity user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
		}

		return issueAuthResponse(user);
	}

	@Transactional
	public AuthResponse refresh(String refreshToken) {
		RefreshTokenService.RefreshTokenIssue issue = refreshTokenService.rotate(refreshToken);
		return new AuthResponse(
			UserResponse.from(issue.user()),
			jwtService.createAccessToken(issue.user()),
			issue.refreshToken()
		);
	}

	@Transactional
	public void logout(String refreshToken) {
		refreshTokenService.revoke(refreshToken);
	}

	private AuthResponse issueAuthResponse(UserEntity user) {
		return new AuthResponse(
			UserResponse.from(user),
			jwtService.createAccessToken(user),
			refreshTokenService.create(user)
		);
	}

	private void createInitialNutritionTarget(UserEntity user, NutritionTargetSetup target) {
		BigDecimal protein = scale(target != null && target.proteinGrams() != null
			? target.proteinGrams()
			: DEFAULT_PROTEIN_GRAMS);
		BigDecimal carbs = scale(target != null && target.carbsGrams() != null
			? target.carbsGrams()
			: DEFAULT_CARBS_GRAMS);
		BigDecimal fat = scale(target != null && target.fatGrams() != null
			? target.fatGrams()
			: DEFAULT_FAT_GRAMS);
		int calories = calculateMacroCalories(protein, carbs, fat);

		jdbcTemplate.update(
			"""
			insert into nutrition_targets
			    (user_id, daily_calories, protein_grams, carbs_grams, fat_grams)
			values (?, ?, ?, ?, ?)
			""",
			user.getId(),
			calories,
			protein,
			carbs,
			fat
		);
	}

	private int calculateMacroCalories(BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
		return protein.multiply(BigDecimal.valueOf(4))
			.add(carbs.multiply(BigDecimal.valueOf(4)))
			.add(fat.multiply(BigDecimal.valueOf(9)))
			.setScale(0, RoundingMode.HALF_UP)
			.intValue();
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private String normalizeUnitPreference(String unitPreference) {
		if (unitPreference == null || unitPreference.isBlank()) {
			return "lb";
		}
		return unitPreference;
	}

	private BigDecimal scale(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}
}
