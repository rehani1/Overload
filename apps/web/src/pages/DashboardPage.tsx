import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Apple, BookOpenCheck, Dumbbell, Flame, Scale, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  getAnalyticsSummary,
  getMealPresets,
  getNutritionEntries,
  getNutritionTarget,
  getWorkouts,
  getWorkoutPresets,
} from "../api/resources";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import {
  formatDate,
  formatDecimal,
  formatInteger,
  formatPercent,
  getDateRange,
  toNumber,
} from "../lib/format";
import type { UnitPreference, Workout } from "../types/api";

const rangeOptions = [
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "1y" },
];

export function DashboardPage() {
  const [selectedDays, setSelectedDays] = useState(30);
  const range = useMemo(() => getDateRange(selectedDays), [selectedDays]);

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary", range],
    queryFn: () => getAnalyticsSummary(range),
  });
  const workoutsQuery = useQuery({ queryKey: ["workouts"], queryFn: getWorkouts });
  const workoutPresetsQuery = useQuery({
    queryKey: ["workout-presets"],
    queryFn: getWorkoutPresets,
  });
  const mealPresetsQuery = useQuery({
    queryKey: ["meal-presets"],
    queryFn: getMealPresets,
  });
  const targetQuery = useQuery({
    queryKey: ["nutrition-target"],
    queryFn: getNutritionTarget,
  });
  const nutritionEntriesQuery = useQuery({
    queryKey: ["nutrition-entries"],
    queryFn: getNutritionEntries,
  });

  const summary = summaryQuery.data;
  const todayKey = getTodayDateKey();
  const todaysNutrition = getNutritionTotalsForDate(nutritionEntriesQuery.data ?? [], todayKey);
  const target = targetQuery.data;
  const remainingCalories = Math.max((target?.dailyCalories ?? 0) - todaysNutrition.calories, 0);
  const calorieProgressPercent = getProgressPercent(
    todaysNutrition.calories,
    target?.dailyCalories ?? 0,
  );
  const totalVolumeLabel =
    summary?.totalVolumeByUnit
      .map((entry) => `${formatInteger(entry.totalVolume)} ${entry.weightUnit}`)
      .join(" / ") || "0";
  const muscleVolumeTrend = useMemo(
    () => getMuscleVolumeTrend(workoutsQuery.data ?? [], range),
    [range, workoutsQuery.data],
  );

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        actions={
          <div className="inline-flex rounded-lg border border-overload-border bg-overload-surface p-1 shadow-sm">
            {rangeOptions.map((option) => (
              <button
                key={option.days}
                className={[
                  "min-h-9 rounded-md px-3 text-sm font-semibold transition",
                  selectedDays === option.days
                    ? "bg-overload-primary text-overload-onPrimary"
                    : "text-overload-muted hover:bg-overload-surface-muted",
                ].join(" ")}
                type="button"
                onClick={() => setSelectedDays(option.days)}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {summaryQuery.isError ? (
        <div className="mb-6">
          <StatusMessage>Unable to load dashboard analytics from the API.</StatusMessage>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="workout"
          icon={Dumbbell}
          label="Workouts logged"
          value={summary ? formatInteger(summary.workoutCount) : "0"}
        />
        <MetricCard accent="primary" icon={Scale} label="Training volume" value={totalVolumeLabel} />
        <MetricCard
          accent="nutrition"
          icon={Flame}
          label="Average calories"
          value={
            summary ? formatInteger(summary.nutritionAverages.calories) : "0"
          }
        />
        <MetricCard
          accent="primary"
          icon={Target}
          label="Protein target"
          value={
            summary
              ? formatPercent(summary.targetAdherence.proteinAdherencePercent)
              : "0.0%"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <SectionPanel title="Muscle-group volume">
          {workoutsQuery.isLoading ? (
            <StatusMessage>Loading volume.</StatusMessage>
          ) : workoutsQuery.isError ? (
            <StatusMessage>Unable to load workout volume.</StatusMessage>
          ) : muscleVolumeTrend.breakdown.length ? (
            <div className="space-y-5">
              {muscleVolumeTrend.canChart ? (
                <MuscleVolumeLineChart trend={muscleVolumeTrend} />
              ) : (
                <StatusMessage>
                  Add completed workouts on at least two dates to show a meaningful volume trend.
                </StatusMessage>
              )}
              <MuscleVolumeBreakdown trend={muscleVolumeTrend} />
            </div>
          ) : (
            <StatusMessage>No completed workout volume in this range.</StatusMessage>
          )}
        </SectionPanel>

        <SectionPanel title="Today's nutrition">
          {targetQuery.isLoading || nutritionEntriesQuery.isLoading ? (
            <StatusMessage>Loading nutrition.</StatusMessage>
          ) : targetQuery.isError || nutritionEntriesQuery.isError ? (
            <StatusMessage>Unable to load today's nutrition.</StatusMessage>
          ) : target ? (
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <CalorieProgressRing
                  progressPercent={calorieProgressPercent}
                  remainingCalories={remainingCalories}
                />
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-overload-ink">Calories</p>
                  <p className="mt-1 text-sm text-overload-muted">
                    {formatInteger(todaysNutrition.calories)} of{" "}
                    {formatInteger(target.dailyCalories)} cal today
                  </p>
                </div>
              </div>
              <MacroRow
                label="Protein"
                value={`${formatDecimal(todaysNutrition.proteinGrams)} g`}
                target={`${formatDecimal(target.proteinGrams)} g`}
                percent={getProgressPercent(todaysNutrition.proteinGrams, target.proteinGrams)}
              />
              <MacroRow
                label="Carbs"
                value={`${formatDecimal(todaysNutrition.carbsGrams)} g`}
                target={`${formatDecimal(target.carbsGrams)} g`}
                percent={getProgressPercent(todaysNutrition.carbsGrams, target.carbsGrams)}
              />
              <MacroRow
                label="Fat"
                value={`${formatDecimal(todaysNutrition.fatGrams)} g`}
                target={`${formatDecimal(target.fatGrams)} g`}
                percent={getProgressPercent(todaysNutrition.fatGrams, target.fatGrams)}
              />
              {summary ? (
                <div className="rounded-lg bg-overload-surface-muted px-4 py-3 text-sm text-overload-muted">
                  {summary.nutritionAverages.loggedDays} logged days in this range,{" "}
                  {formatInteger(summary.targetAdherence.averageCalorieDelta)} calorie average delta.
                </div>
              ) : null}
            </div>
          ) : (
            <StatusMessage>No nutrition target found.</StatusMessage>
          )}
        </SectionPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,0.7fr)_minmax(0,1.3fr)]">
        <SectionPanel title="Library snapshot">
          <div className="grid gap-3 sm:grid-cols-3">
            <SnapshotTile icon={Dumbbell} label="Workouts" value={workoutsQuery.data?.length ?? 0} />
            <SnapshotTile
              icon={BookOpenCheck}
              label="Workout presets"
              value={workoutPresetsQuery.data?.length ?? 0}
            />
            <SnapshotTile
              icon={Apple}
              label="Meal presets"
              value={mealPresetsQuery.data?.length ?? 0}
            />
          </div>
          {targetQuery.data ? (
            <div className="mt-4 rounded-lg bg-overload-primary px-4 py-3 text-sm font-medium text-overload-onPrimary">
              Daily target: {targetQuery.data.dailyCalories.toLocaleString()} calories,{" "}
              {formatDecimal(targetQuery.data.proteinGrams)} g protein.
            </div>
          ) : null}
        </SectionPanel>

        <SectionPanel title="Recent activity">
          {summaryQuery.isLoading ? (
            <StatusMessage>Loading activity.</StatusMessage>
          ) : summary?.recentActivity.length ? (
            <div className="divide-y divide-overload-border">
              {summary.recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[120px_minmax(0,1fr)_120px]"
                >
                  <span className={`font-medium capitalize ${getActivityTypeClass(activity.type)}`}>
                    {activity.type}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-overload-ink">{activity.title}</p>
                    <p className="truncate text-overload-muted">{activity.subtitle}</p>
                  </div>
                  <span className="text-left text-overload-muted sm:text-right">
                    {formatDate(activity.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <StatusMessage>No recent activity in this range.</StatusMessage>
          )}
        </SectionPanel>
      </div>
    </>
  );
}

type MacroRowProps = {
  label: string;
  percent: number | string;
  target: string;
  value: string;
};

function MacroRow({ label, percent, target, value }: MacroRowProps) {
  const percentValue = Math.min(125, Math.max(0, toNumber(percent)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-overload-ink">{label}</span>
        <span className="text-overload-muted">
          {value} / {target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-overload-surface-muted">
        <div
          className="h-full rounded-full bg-overload-primary"
          style={{ width: `${Math.max(6, percentValue)}%` }}
        />
      </div>
    </div>
  );
}

type SnapshotTileProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

function SnapshotTile({ icon: Icon, label, value }: SnapshotTileProps) {
  return (
    <div className="rounded-lg border border-overload-border bg-overload-elevated px-4 py-3">
      <Icon className="h-4 w-4 text-overload-primary" aria-hidden="true" />
      <p className="mt-3 text-2xl font-semibold text-overload-ink">{value}</p>
      <p className="text-sm text-overload-muted">{label}</p>
    </div>
  );
}

type CalorieProgressRingProps = {
  progressPercent: number;
  remainingCalories: number;
};

function CalorieProgressRing({
  progressPercent,
  remainingCalories,
}: CalorieProgressRingProps) {
  const ringSize = 132;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const strokeOffset = circumference * (1 - clampedProgress / 100);

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${ringSize} ${ringSize}`}
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          fill="none"
          r={radius}
          stroke="#F4F7F5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          fill="none"
          r={radius}
          stroke="#30245F"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
        />
      </svg>

      <div className="relative z-[1] flex h-24 w-24 flex-col items-center justify-center rounded-full bg-overload-surface text-center shadow-inner">
        <span className="max-w-[5.5rem] truncate text-[1.45rem] font-semibold leading-7 text-overload-ink">
          {formatInteger(remainingCalories)}
        </span>
        <span className="text-[0.68rem] font-semibold uppercase leading-4 text-overload-muted">
          cal left
        </span>
      </div>
    </div>
  );
}

function getTodayDateKey() {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function getNutritionTotalsForDate(
  entries: Array<{
    calories: number;
    carbsGrams: number | string;
    date: string;
    fatGrams: number | string;
    proteinGrams: number | string;
  }>,
  dateKey: string,
) {
  return entries
    .filter((entry) => entry.date.slice(0, 10) === dateKey)
    .reduce(
      (totals, entry) => ({
        calories: totals.calories + toNumber(entry.calories),
        carbsGrams: totals.carbsGrams + toNumber(entry.carbsGrams),
        fatGrams: totals.fatGrams + toNumber(entry.fatGrams),
        proteinGrams: totals.proteinGrams + toNumber(entry.proteinGrams),
      }),
      {
        calories: 0,
        carbsGrams: 0,
        fatGrams: 0,
        proteinGrams: 0,
      },
    );
}

function getProgressPercent(current: number | string, target: number | string) {
  const targetValue = toNumber(target);

  if (targetValue <= 0) {
    return 0;
  }

  return Math.min(125, Math.max(0, (toNumber(current) / targetValue) * 100));
}

function getActivityTypeClass(type: string) {
  return type === "nutrition" ? "text-overload-nutrition" : "text-overload-workout";
}

type MuscleVolumeTrend = {
  breakdown: MuscleVolumeBreakdownEntry[];
  canChart: boolean;
  points: MuscleVolumePoint[];
  series: MuscleVolumeSeries[];
  unit: UnitPreference;
};

type MuscleVolumeBreakdownEntry = {
  muscleGroup: string;
  totalVolume: number;
};

type MuscleVolumePoint = {
  date: string;
  label: string;
  totals: Record<string, number>;
};

type MuscleVolumeSeries = {
  color: string;
  muscleGroup: string;
  totalVolume: number;
};

const volumeChartColors = ["#30245F", "#4EBC7B", "#D9857B", "#7B6BC8"];

function getMuscleVolumeTrend(workouts: Workout[], range: { from: string; to: string }) {
  const totalsByUnit = new Map<UnitPreference, number>();
  const totalsByUnitAndMuscle = new Map<string, number>();
  const totalsByDateUnitAndMuscle = new Map<string, number>();
  const fromTime = new Date(`${range.from}T00:00:00`).getTime();
  const toTime = new Date(`${range.to}T23:59:59`).getTime();

  workouts.forEach((workout) => {
    if (workout.status !== "completed") {
      return;
    }

    const dateKey = workout.date.slice(0, 10);
    const workoutTime = new Date(`${dateKey}T12:00:00`).getTime();

    if (
      Number.isNaN(workoutTime) ||
      workoutTime < fromTime ||
      workoutTime > toTime
    ) {
      return;
    }

    workout.exercises.forEach((workoutExercise) => {
      const muscleGroup = workoutExercise.exercise.muscleGroup?.trim() || "Other";

      workoutExercise.sets.forEach((set) => {
        const volume = toNumber(set.reps) * toNumber(set.weight);

        if (volume <= 0) {
          return;
        }

        const unit = set.weightUnit ?? "lb";
        totalsByUnit.set(unit, (totalsByUnit.get(unit) ?? 0) + volume);
        addMapValue(totalsByUnitAndMuscle, getVolumeKey(unit, muscleGroup), volume);
        addMapValue(
          totalsByDateUnitAndMuscle,
          getVolumeKey(dateKey, unit, muscleGroup),
          volume,
        );
      });
    });
  });

  const unit =
    [...totalsByUnit.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "lb";
  const breakdown = [...totalsByUnitAndMuscle.entries()]
    .map(([key, totalVolume]) => {
      const [entryUnit, muscleGroup] = key.split("::");

      return {
        muscleGroup,
        totalVolume: entryUnit === unit ? totalVolume : 0,
      };
    })
    .filter((entry) => entry.totalVolume > 0)
    .sort((a, b) => b.totalVolume - a.totalVolume);
  const series = breakdown.slice(0, 4).map((entry, index) => ({
    color: volumeChartColors[index % volumeChartColors.length],
    muscleGroup: entry.muscleGroup,
    totalVolume: entry.totalVolume,
  }));
  const chartDateKeys = [
    ...new Set(
      [...totalsByDateUnitAndMuscle.keys()]
        .map((key) => key.split("::"))
        .filter(([, entryUnit, muscleGroup]) =>
          entryUnit === unit && series.some((entry) => entry.muscleGroup === muscleGroup),
        )
        .map(([date]) => date),
    ),
  ].sort();
  const points = chartDateKeys.map((date) => ({
    date,
    label: formatChartDate(date),
    totals: Object.fromEntries(
      series.map((entry) => [
        entry.muscleGroup,
        totalsByDateUnitAndMuscle.get(getVolumeKey(date, unit, entry.muscleGroup)) ?? 0,
      ]),
    ),
  }));

  return {
    breakdown,
    canChart: points.length >= 2 && series.length > 0,
    points,
    series,
    unit,
  };
}

type MuscleVolumeLineChartProps = {
  trend: MuscleVolumeTrend;
};

function MuscleVolumeLineChart({ trend }: MuscleVolumeLineChartProps) {
  const width = 760;
  const height = 280;
  const padding = {
    bottom: 42,
    left: 58,
    right: 18,
    top: 20,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...trend.points.flatMap((point) =>
      trend.series.map((series) => point.totals[series.muscleGroup] ?? 0),
    ),
  );
  const gridValues = [1, 0.75, 0.5, 0.25, 0].map((ratio) => maxValue * ratio);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-overload-ink">Completed workout trend</p>
          <p className="mt-1 text-sm text-overload-muted">
            Volume by muscle group across workout dates, shown in {trend.unit}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {trend.series.map((series) => (
            <span
              key={series.muscleGroup}
              className="inline-flex items-center gap-2 rounded-lg border border-overload-border bg-overload-elevated px-3 py-1.5 text-sm font-medium text-overload-muted"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              {series.muscleGroup}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-overload-border bg-overload-elevated px-3 py-3">
        <svg
          aria-label={`Muscle-group volume trend in ${trend.unit}`}
          className="h-[280px] w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          {gridValues.map((value) => {
            const y = getChartY(value, maxValue, chartHeight, padding.top);

            return (
              <g key={value}>
                <line
                  stroke="#D6E4EA"
                  strokeWidth="1"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#6B7584"
                  fontSize="12"
                  textAnchor="end"
                  x={padding.left - 10}
                  y={y + 4}
                >
                  {formatInteger(value)}
                </text>
              </g>
            );
          })}

          {trend.series.map((series) => {
            const path = trend.points
              .map((point, index) => {
                const x = getChartX(index, trend.points.length, chartWidth, padding.left);
                const y = getChartY(
                  point.totals[series.muscleGroup] ?? 0,
                  maxValue,
                  chartHeight,
                  padding.top,
                );

                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            return (
              <g key={series.muscleGroup}>
                <path
                  d={path}
                  fill="none"
                  stroke={series.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                {trend.points.map((point, index) => (
                  <circle
                    key={`${series.muscleGroup}-${point.date}`}
                    cx={getChartX(index, trend.points.length, chartWidth, padding.left)}
                    cy={getChartY(
                      point.totals[series.muscleGroup] ?? 0,
                      maxValue,
                      chartHeight,
                      padding.top,
                    )}
                    fill="#FFFFFF"
                    r="4"
                    stroke={series.color}
                    strokeWidth="3"
                  />
                ))}
              </g>
            );
          })}

          {trend.points.map((point, index) => (
            <text
              key={point.date}
              fill="#6B7584"
              fontSize="12"
              textAnchor={index === 0 ? "start" : index === trend.points.length - 1 ? "end" : "middle"}
              x={getChartX(index, trend.points.length, chartWidth, padding.left)}
              y={height - 12}
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

type MuscleVolumeBreakdownProps = {
  trend: MuscleVolumeTrend;
};

function MuscleVolumeBreakdown({ trend }: MuscleVolumeBreakdownProps) {
  const maxVolume = Math.max(1, ...trend.breakdown.map((entry) => entry.totalVolume));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {trend.breakdown.slice(0, 8).map((entry) => (
        <div
          key={entry.muscleGroup}
          className="rounded-lg border border-overload-border bg-overload-elevated px-3 py-3"
        >
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-overload-ink">{entry.muscleGroup}</span>
            <span className="text-overload-muted">
              {formatInteger(entry.totalVolume)} {trend.unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-overload-surface-muted">
            <div
              className="h-full rounded-full bg-overload-workout"
              style={{ width: `${Math.max(8, (entry.totalVolume / maxVolume) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function getChartX(index: number, pointCount: number, chartWidth: number, left: number) {
  if (pointCount <= 1) {
    return left;
  }

  return left + (index / (pointCount - 1)) * chartWidth;
}

function getChartY(value: number, maxValue: number, chartHeight: number, top: number) {
  return top + (1 - value / maxValue) * chartHeight;
}

function formatChartDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getVolumeKey(...parts: string[]) {
  return parts.join("::");
}

function addMapValue(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}
