package com.rehanislam.overload.exercise;

import java.util.UUID;

record ExerciseRow(
	String id,
	UUID ownerId,
	String name,
	String muscleGroup,
	String equipment,
	boolean isCustom
) {
}
