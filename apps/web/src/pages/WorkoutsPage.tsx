import { useQuery } from "@tanstack/react-query";

import { getWorkouts } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import { formatDate, formatDecimal, formatInteger } from "../lib/format";
import type { Workout, WorkoutExercise, WorkoutSet } from "../types/api";

export function WorkoutsPage() {
  const workoutsQuery = useQuery({ queryKey: ["workouts"], queryFn: getWorkouts });

  return (
    <>
      <PageHeader eyebrow="Training" title="Workouts" />

      <SectionPanel title="Workout history">
        {workoutsQuery.isLoading ? (
          <StatusMessage>Loading workouts.</StatusMessage>
        ) : workoutsQuery.isError ? (
          <StatusMessage>Unable to load workouts from the API.</StatusMessage>
        ) : workoutsQuery.data?.length ? (
          <div className="grid gap-4">
            {workoutsQuery.data.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        ) : (
          <StatusMessage>No workouts found.</StatusMessage>
        )}
      </SectionPanel>
    </>
  );
}

type WorkoutCardProps = {
  workout: Workout;
};

function WorkoutCard({ workout }: WorkoutCardProps) {
  const setCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );

  return (
    <article className="overflow-hidden rounded-lg border border-overload-border bg-overload-elevated shadow-sm">
      <div className="border-l-4 border-overload-primary px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-overload-ink">{workout.title}</h3>
            <p className="mt-1 text-sm text-overload-muted">{formatDate(workout.date)}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SummaryPill label="Status" value={capitalize(workout.status)} strong />
            <SummaryPill label="Exercises" value={formatInteger(workout.exercises.length)} />
            <SummaryPill label="Sets" value={formatInteger(setCount)} />
          </div>
        </div>

        {workout.notes ? (
          <p className="mt-4 max-w-4xl border-t border-overload-border pt-3 text-sm leading-6 text-overload-muted">
            {workout.notes}
          </p>
        ) : null}
      </div>

      {workout.exercises.length ? (
        <div className="border-t border-overload-border">
          {workout.exercises.map((exercise) => (
            <WorkoutExerciseBlock key={exercise.id} exercise={exercise} />
          ))}
        </div>
      ) : (
        <div className="border-t border-overload-border px-5 py-4 text-sm text-overload-muted">
          No exercise details logged for this workout.
        </div>
      )}
    </article>
  );
}

type SummaryPillProps = {
  label: string;
  value: string;
  strong?: boolean;
};

function SummaryPill({ label, value, strong = false }: SummaryPillProps) {
  return (
    <div
      className={
        strong
          ? "rounded-lg bg-overload-primary px-3 py-2 text-overload-onPrimary"
          : "rounded-lg border border-overload-border bg-overload-surface px-3 py-2 text-overload-ink"
      }
    >
      <p className={strong ? "text-[11px] font-semibold uppercase tracking-widest text-overload-primary-muted" : "text-[11px] font-semibold uppercase tracking-widest text-overload-muted"}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

type WorkoutExerciseBlockProps = {
  exercise: WorkoutExercise;
};

function WorkoutExerciseBlock({ exercise }: WorkoutExerciseBlockProps) {
  const meta = getExerciseMeta(exercise);

  return (
    <div className="px-5 py-4 first:pt-5 last:pb-5 [&+&]:border-t [&+&]:border-overload-border">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-overload-ink">{exercise.exercise.name}</p>
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

      {exercise.sets.length ? <SetTable sets={exercise.sets} /> : null}
    </div>
  );
}

type SetRowProps = {
  set: WorkoutSet;
};

type SetTableProps = {
  sets: WorkoutSet[];
};

function SetTable({ sets }: SetTableProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-overload-border">
      <div className="grid grid-cols-[72px_1fr_1fr_1fr_92px] bg-overload-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-overload-muted">
        <span>Set</span>
        <span>Reps</span>
        <span>Load</span>
        <span>RPE</span>
        <span>Type</span>
      </div>
      <div className="divide-y divide-overload-border bg-overload-elevated">
        {sets.map((set) => (
          <SetRow key={set.id} set={set} />
        ))}
      </div>
    </div>
  );
}

function SetRow({ set }: SetRowProps) {
  return (
    <div className="grid grid-cols-[72px_1fr_1fr_1fr_92px] px-3 py-2.5 text-sm text-overload-muted">
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
