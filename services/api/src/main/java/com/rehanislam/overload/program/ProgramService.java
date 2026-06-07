package com.rehanislam.overload.program;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.rehanislam.overload.program.ProgramDtos.ProgramRequest;
import com.rehanislam.overload.program.ProgramDtos.ProgramResponse;
import com.rehanislam.overload.program.ProgramDtos.ProgramUpdateRequest;
import com.rehanislam.overload.program.ProgramRepository.ProgramWrite;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProgramService {

	private final ProgramRepository programRepository;

	public ProgramService(ProgramRepository programRepository) {
		this.programRepository = programRepository;
	}

	@Transactional(readOnly = true)
	public List<ProgramResponse> findAll(UUID userId) {
		return programRepository.findAll(userId);
	}

	@Transactional(readOnly = true)
	public ProgramResponse findById(UUID userId, String id) {
		return programRepository.findById(userId, parseUuid(id))
			.orElseThrow(() -> notFound("Program not found."));
	}

	@Transactional
	public ProgramResponse create(UUID userId, ProgramRequest request) {
		return programRepository.create(userId, new ProgramWrite(
			request.name().trim(),
			request.goal().trim(),
			trimToNull(request.notes()),
			normalizeDays(request.days())
		));
	}

	@Transactional
	public ProgramResponse update(UUID userId, String id, ProgramUpdateRequest request) {
		ProgramResponse existing = findById(userId, id);
		return programRepository.update(userId, parseUuid(id), new ProgramWrite(
			request.name() == null ? existing.name() : request.name().trim(),
			request.goal() == null ? existing.goal() : request.goal().trim(),
			request.notes() == null ? existing.notes() : trimToNull(request.notes()),
			request.days() == null ? existing.days() : normalizeDays(request.days())
		)).orElseThrow(() -> notFound("Program not found."));
	}

	@Transactional
	public void delete(UUID userId, String id) {
		if (!programRepository.delete(userId, parseUuid(id))) {
			throw notFound("Program not found.");
		}
	}

	private JsonNode normalizeDays(JsonNode days) {
		if (!days.isArray()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program days must be an array.");
		}
		return days.deepCopy();
	}

	private String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}

	private UUID parseUuid(String id) {
		try {
			return UUID.fromString(id);
		} catch (IllegalArgumentException ex) {
			throw notFound("Program not found.");
		}
	}

	private ResponseStatusException notFound(String message) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
	}
}
