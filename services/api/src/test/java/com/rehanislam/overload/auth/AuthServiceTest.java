package com.rehanislam.overload.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import com.rehanislam.overload.auth.AuthDtos.LoginRequest;
import com.rehanislam.overload.auth.AuthDtos.NutritionTargetSetup;
import com.rehanislam.overload.auth.AuthDtos.RegisterRequest;
import com.rehanislam.overload.user.UserEntity;
import com.rehanislam.overload.user.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	private JdbcTemplate jdbcTemplate;

	@Mock
	private JwtService jwtService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private RefreshTokenService refreshTokenService;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private AuthService authService;

	@Test
	void registerCreatesUserAndInitialNutritionTarget() {
		UUID userId = UUID.randomUUID();
		when(userRepository.existsByEmailIgnoreCase("rehan@example.com")).thenReturn(false);
		when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
		when(userRepository.saveAndFlush(any(UserEntity.class))).thenAnswer(invocation -> {
			UserEntity user = invocation.getArgument(0);
			user.setId(userId);
			return user;
		});
		when(jwtService.createAccessToken(any(UserEntity.class))).thenReturn("access-token");
		when(refreshTokenService.create(any(UserEntity.class))).thenReturn("refresh-token");

		RegisterRequest request = new RegisterRequest(
			" Rehan@Example.com ",
			"password123",
			"Rehan",
			"Islam",
			"Build strength",
			70,
			"male",
			new BigDecimal("185"),
			null,
			new NutritionTargetSetup(
				new BigDecimal("100"),
				new BigDecimal("200"),
				new BigDecimal("50")
			)
		);

		AuthDtos.AuthResponse response = authService.register(request);

		assertThat(response.user().id()).isEqualTo(userId.toString());
		assertThat(response.user().email()).isEqualTo("rehan@example.com");
		assertThat(response.user().unitPreference()).isEqualTo("lb");
		assertThat(response.accessToken()).isEqualTo("access-token");
		assertThat(response.refreshToken()).isEqualTo("refresh-token");
		verify(jdbcTemplate).update(
			anyString(),
			eq(userId),
			eq(1650),
			eq(new BigDecimal("100.00")),
			eq(new BigDecimal("200.00")),
			eq(new BigDecimal("50.00"))
		);
	}

	@Test
	void loginRejectsInvalidPassword() {
		UserEntity user = new UserEntity();
		user.setEmail("rehan@example.com");
		user.setPasswordHash("encoded-password");
		when(userRepository.findByEmailIgnoreCase("rehan@example.com")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

		assertThatThrownBy(() -> authService.login(new LoginRequest("rehan@example.com", "wrong-password")))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("401");
	}
}
