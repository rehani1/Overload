package com.rehanislam.overload.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private UserService userService;

	@Test
	void updateMeOnlyChangesProvidedProfileFields() {
		UUID userId = UUID.randomUUID();
		UserEntity user = new UserEntity();
		user.setId(userId);
		user.setEmail("rehan@example.com");
		user.setFirstName("Rehan");
		user.setLastName("Islam");
		user.setGoal("Build strength");
		user.setHeightInches(70);
		user.setSex("male");
		user.setUnitPreference("lb");
		user.setWeightPounds(new BigDecimal("185.00"));
		when(userRepository.findById(userId)).thenReturn(Optional.of(user));

		UserResponse response = userService.updateMe(
			userId,
			new UpdateProfileRequest("Cut slowly", null, null, "kg", new BigDecimal("180"))
		);

		assertThat(response.goal()).isEqualTo("Cut slowly");
		assertThat(response.heightInches()).isEqualTo(70);
		assertThat(response.sex()).isEqualTo("male");
		assertThat(response.unitPreference()).isEqualTo("kg");
		assertThat(response.weightPounds()).isEqualByComparingTo("180.00");
	}
}
