import { useQuery } from "@tanstack/react-query";

import { getMealPresets, getWorkoutPresets } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import { formatDate, formatDateTime, formatDecimal, formatInteger } from "../lib/format";
import type { MealPreset, WorkoutExercise, WorkoutPreset, WorkoutSet } from "../types/api";

export function PresetsPage() {
  const workoutPresetsQuery = useQuery({
    queryKey: ["workout-presets"],
    queryFn: getWorkoutPresets,
  });
  const mealPresetsQuery = useQuery({
    queryKey: ["meal-presets"],
    queryFn: getMealPresets,
  });

  return (
    <>
      <PageHeader eyebrow="Saved" title="Presets" />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionPanel title="Workout presets">
          {workoutPresetsQuery.isLoading ? (
            <StatusMessage>Loading workout presets.</StatusMessage>
          ) : workoutPresetsQuery.isError ? (
            <StatusMessage>Unable to load workout presets from the API.</StatusMessage>
          ) : workoutPresetsQuery.data?.length ? (
            <div className="grid gap-3">
              {workoutPresetsQuery.data.map((preset) => (
                <WorkoutPresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          ) : (
            <StatusMessage>No workout presets found.</StatusMessage>
          )}
        </SectionPanel>

        <SectionPanel title="Meal presets">
          {mealPresetsQuery.isLoading ? (
            <StatusMessage>Loading meal presets.</StatusMessage>
          ) : mealPresetsQuery.isError ? (
            <StatusMessage>Unable to load meal presets from the API.</StatusMessage>
          ) : mealPresetsQuery.data?.length ? (
            <div className="grid gap-3">
              {mealPresetsQuery.data.map((preset) => (
                <MealPresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          ) : (
            <StatusMessage>No meal presets found.</StatusMessage>
          )}
        </SectionPanel>
      </div>
    </>
  );
}

type WorkoutPresetCardProps = {
  preset: WorkoutPreset;
};

function WorkoutPresetCard({ preset }: WorkoutPresetCardProps) {
  const setCount = preset.workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );

  return (
    <article className="overflow-hidden rounded-lg border border-overload-border bg-overload-elevated shadow-sm">
      <div className="border-l-4 border-overload-primary px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-overload-muted">
              Workout preset
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-overload-ink">
              {preset.title}
            </h3>
            {preset.workout.title !== preset.title ? (
              <p className="mt-1 text-sm text-overload-muted">{preset.workout.title}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <PresetStat label="Exercises" value={formatInteger(preset.workout.exercises.length)} />
            <PresetStat label="Sets" value={formatInteger(setCount)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-widest text-overload-muted">
          <span>Saved {formatDateTime(preset.createdAt)}</span>
          <span>Source {formatDate(preset.workout.date)}</span>
          <span>{capitalize(preset.workout.status)}</span>
        </div>

        {preset.workout.notes ? (
          <p className="mt-3 rounded-lg bg-overload-surface px-3 py-2 text-sm leading-6 text-overload-muted">
            {preset.workout.notes}
          </p>
        ) : null}
      </div>

      {preset.workout.exercises.length ? (
        <div className="border-t border-overload-border">
          {preset.workout.exercises.map((exercise) => (
            <PresetExerciseBlock key={exercise.id} exercise={exercise} />
          ))}
        </div>
      ) : (
        <div className="border-t border-overload-border px-4 py-4 text-sm text-overload-muted">
          No exercise details saved in this preset.
        </div>
      )}
    </article>
  );
}

type MealPresetCardProps = {
  preset: MealPreset;
};

function MealPresetCard({ preset }: MealPresetCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-overload-border bg-overload-elevated shadow-sm">
      <div className="border-l-4 border-overload-primary px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-overload-muted">
              Meal preset
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-overload-ink">
              {preset.foodName}
            </h3>
            <p className="mt-1 text-sm capitalize text-overload-muted">{preset.entry.mealType}</p>
          </div>
          <div className="rounded-lg bg-overload-primary px-3 py-2 text-overload-onPrimary">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-overload-primary-muted">
              Calories
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {formatInteger(preset.entry.calories)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <MacroStat label="Protein" value={`${formatDecimal(preset.entry.proteinGrams)}g`} />
          <MacroStat label="Carbs" value={`${formatDecimal(preset.entry.carbsGrams)}g`} />
          <MacroStat label="Fat" value={`${formatDecimal(preset.entry.fatGrams)}g`} />
          <MacroStat label="Serving" value={formatDecimal(preset.entry.servingQuantity)} />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-overload-muted sm:grid-cols-2">
          <span>Entry date {formatDate(preset.entry.date)}</span>
          <span>Saved {formatDateTime(preset.createdAt)}</span>
          <span>Updated {formatDateTime(preset.entry.updatedAt)}</span>
        </div>

        {preset.entry.notes ? (
          <p className="mt-3 rounded-lg bg-overload-surface px-3 py-2 text-sm leading-6 text-overload-muted">
            {preset.entry.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

type PresetExerciseBlockProps = {
  exercise: WorkoutExercise;
};

function PresetExerciseBlock({ exercise }: PresetExerciseBlockProps) {
  const meta = getExerciseMeta(exercise);

  return (
    <div className="px-4 py-4 first:pt-5 last:pb-5 [&+&]:border-t [&+&]:border-overload-border">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-overload-ink">{exercise.exercise.name}</p>
          {meta ? <p className="mt-1 text-sm text-overload-muted">{meta}</p> : null}
        </div>
        <span className="w-fit rounded-lg bg-overload-success-muted px-3 py-1 text-sm font-semibold text-overload-workout">
          {formatInteger(exercise.sets.length)} sets
        </span>
      </div>
      {exercise.notes ? (
        <p className="mt-3 rounded-lg bg-overload-surface px-3 py-2 text-sm leading-6 text-overload-muted">
          {exercise.notes}
        </p>
      ) : null}
      {exercise.sets.length ? <PresetSetTable sets={exercise.sets} /> : null}
    </div>
  );
}

type PresetSetRowProps = {
  set: WorkoutSet;
};

type PresetSetTableProps = {
  sets: WorkoutSet[];
};

function PresetSetTable({ sets }: PresetSetTableProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-overload-border">
      <div className="grid grid-cols-[64px_1fr_1fr_1fr_84px] bg-overload-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-overload-muted">
        <span>Set</span>
        <span>Reps</span>
        <span>Load</span>
        <span>RPE</span>
        <span>Type</span>
      </div>
      <div className="divide-y divide-overload-border bg-overload-elevated">
        {sets.map((set) => (
          <PresetSetRow key={set.id} set={set} />
        ))}
      </div>
    </div>
  );
}

function PresetSetRow({ set }: PresetSetRowProps) {
  return (
    <div className="grid grid-cols-[64px_1fr_1fr_1fr_84px] px-3 py-2.5 text-sm text-overload-muted">
      <span className="font-semibold text-overload-ink">{set.setNumber}</span>
      <span>{formatInteger(set.reps)}</span>
      <span>
        {formatDecimal(set.weight)} {set.weightUnit ?? ""}
      </span>
      <span>{set.rpe !== undefined ? formatDecimal(set.rpe) : "-"}</span>
      <span>{set.isWarmup ? "Warmup" : "Work"}</span>
    </div>
  );
}

type PresetStatProps = {
  label: string;
  value: string;
};

function PresetStat({ label, value }: PresetStatProps) {
  return (
    <div className="rounded-lg bg-overload-primary px-3 py-2 text-overload-onPrimary">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-overload-primary-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

type MacroStatProps = {
  label: string;
  value: string;
};

function MacroStat({ label, value }: MacroStatProps) {
  return (
    <div className="rounded-lg border border-overload-border bg-overload-surface px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-overload-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-overload-ink">{value}</p>
    </div>
  );
}

function getExerciseMeta(exercise: WorkoutExercise) {
  return [
    exercise.exercise.muscleGroup,
    exercise.exercise.equipment,
    exercise.exercise.isCustom ? "Custom" : "Default",
  ]
    .filter((value) => value?.trim())
    .join(" · ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
