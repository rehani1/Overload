package com.rehanislam.overload.nutrition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.rehanislam.overload.nutrition.NutritionDtos.CreateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionEntryResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.NutritionTargetResponse;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionEntryRequest;
import com.rehanislam.overload.nutrition.NutritionDtos.UpdateNutritionTargetRequest;
import com.rehanislam.overload.nutrition.NutritionRepository.NutritionEntryWrite;
import com.rehanislam.overload.nutrition.NutritionRepository.NutritionTargetWrite;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NutritionService {

	private static final BigDecimal DEFAULT_PROTEIN_GRAMS = new BigDecimal("180.00");
	private static final BigDecimal DEFAULT_CARBS_GRAMS = new BigDecimal("260.00");
	private static final BigDecimal DEFAULT_FAT_GRAMS = new BigDecimal("75.00");

	private final NutritionRepository nutritionRepository;

	public NutritionService(NutritionRepository nutritionRepository) {
		this.nutritionRepository = nutritionRepository;
	}

	@Transactional(readOnly = true)
	public List<NutritionEntryResponse> findEntries(UUID userId, String date) {
		return nutritionRepository.findEntries(userId, date == null ? null : parseDate(date));
	}

	@Transactional
	public NutritionEntryResponse createEntry(UUID userId, CreateNutritionEntryRequest request) {
		UUID clientId = parseOptionalUuid(request.clientId());
		if (clientId != null) {
			var existingEntry = nutritionRepository.findByClientId(userId, clientId);
			if (existingEntry.isPresent()) {
				return existingEntry.get();
			}
		}

		return nutritionRepository.create(userId, toWrite(request, clientId));
	}

	@Transactional
	public NutritionEntryResponse updateEntry(UUID userId, String id, UpdateNutritionEntryRequest request) {
		NutritionEntryResponse existing = nutritionRepository.findEntry(userId, parseUuid(id))
			.orElseThrow(() -> notFound("Nutrition entry not found."));
		NutritionEntryWrite merged = new NutritionEntryWrite(
			null,
			request.date() == null ? parseDate(existing.date()) : parseDate(request.date()),
			request.mealType() == null ? existing.mealType() : request.mealType(),
			request.foodName() == null ? existing.foodName() : request.foodName().trim(),
			scale(request.servingQuantity() == null ? existing.servingQuantity() : request.servingQuantity()),
			0,
			scale(request.proteinGrams() == null ? existing.proteinGrams() : request.proteinGrams()),
			scale(request.carbsGrams() == null ? existing.carbsGrams() : request.carbsGrams()),
			scale(request.fatGrams() == null ? existing.fatGrams() : request.fatGrams()),
			request.notes() == null ? existing.notes() : trimToNull(request.notes())
		);
		merged = withDerivedCalories(merged);

		return nutritionRepository.update(userId, parseUuid(id), merged)
			.orElseThrow(() -> notFound("Nutrition entry not found."));
	}

	@Transactional
	public void deleteEntry(UUID userId, String id) {
		if (!nutritionRepository.delete(userId, parseUuid(id))) {
			throw notFound("Nutrition entry not found.");
		}
	}

	@Transactional
	public NutritionTargetResponse getTarget(UUID userId) {
		return nutritionRepository.findLatestTarget(userId)
			.orElseGet(() -> nutritionRepository.upsertTarget(userId, defaultTarget()));
	}

	@Transactional
	public NutritionTargetResponse updateTarget(UUID userId, UpdateNutritionTargetRequest request) {
		NutritionTargetResponse current = getTarget(userId);
		BigDecimal protein = scale(request.proteinGrams() == null ? current.proteinGrams() : request.proteinGrams());
		BigDecimal carbs = scale(request.carbsGrams() == null ? current.carbsGrams() : request.carbsGrams());
		BigDecimal fat = scale(request.fatGrams() == null ? current.fatGrams() : request.fatGrams());
		return nutritionRepository.upsertTarget(userId, new NutritionTargetWrite(
			calculateMacroCalories(protein, carbs, fat),
			protein,
			carbs,
			fat
		));
	}

	private NutritionEntryWrite toWrite(CreateNutritionEntryRequest request, UUID clientId) {
		NutritionEntryWrite write = new NutritionEntryWrite(
			clientId,
			parseDate(request.date()),
			request.mealType(),
			request.foodName().trim(),
			scale(request.servingQuantity() == null ? BigDecimal.ONE : request.servingQuantity()),
			0,
			scale(request.proteinGrams() == null ? BigDecimal.ZERO : request.proteinGrams()),
			scale(request.carbsGrams() == null ? BigDecimal.ZERO : request.carbsGrams()),
			scale(request.fatGrams() == null ? BigDecimal.ZERO : request.fatGrams()),
			trimToNull(request.notes())
		);
		return withDerivedCalories(write);
	}

	private NutritionEntryWrite withDerivedCalories(NutritionEntryWrite write) {
		return new NutritionEntryWrite(
			write.clientId(),
			write.date(),
			write.mealType(),
			write.foodName(),
			write.servingQuantity(),
			calculateMacroCalories(write.proteinGrams(), write.carbsGrams(), write.fatGrams()),
			write.proteinGrams(),
			write.carbsGrams(),
			write.fatGrams(),
			write.notes()
		);
	}

	private NutritionTargetWrite defaultTarget() {
		return new NutritionTargetWrite(
			calculateMacroCalories(DEFAULT_PROTEIN_GRAMS, DEFAULT_CARBS_GRAMS, DEFAULT_FAT_GRAMS),
			DEFAULT_PROTEIN_GRAMS,
			DEFAULT_CARBS_GRAMS,
			DEFAULT_FAT_GRAMS
		);
	}

	int calculateMacroCalories(BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
		return protein.multiply(BigDecimal.valueOf(4))
			.add(carbs.multiply(BigDecimal.valueOf(4)))
			.add(fat.multiply(BigDecimal.valueOf(9)))
			.setScale(0, RoundingMode.HALF_UP)
			.intValue();
	}

	private LocalDate parseDate(String value) {
		try {
			String trimmed = value.trim();
			return LocalDate.parse(trimmed.length() >= 10 ? trimmed.substring(0, 10) : trimmed);
		} catch (RuntimeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an ISO date.");
		}
	}

	private UUID parseUuid(String id) {
		try {
			return UUID.fromString(id);
		} catch (IllegalArgumentException ex) {
			throw notFound("Nutrition entry not found.");
		}
	}

	private UUID parseOptionalUuid(String id) {
		if (id == null || id.trim().isEmpty()) {
			return null;
		}
		try {
			return UUID.fromString(id.trim());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clientId must be a UUID.");
		}
	}

	private BigDecimal scale(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}

	private String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}

	private ResponseStatusException notFound(String message) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
	}
}
