import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Dumbbell, Flame, Library, Scale, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  getAnalyticsSummary,
  getExercises,
  getNutritionTarget,
  getPrograms,
  getWorkouts,
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
  const exercisesQuery = useQuery({ queryKey: ["exercises"], queryFn: getExercises });
  const programsQuery = useQuery({ queryKey: ["programs"], queryFn: getPrograms });
  const targetQuery = useQuery({
    queryKey: ["nutrition-target"],
    queryFn: getNutritionTarget,
  });

  const summary = summaryQuery.data;
  const totalVolumeLabel =
    summary?.totalVolumeByUnit
      .map((entry) => `${formatInteger(entry.totalVolume)} ${entry.weightUnit}`)
      .join(" / ") || "0";
  const maxMuscleVolume = Math.max(
    1,
    ...(summary?.muscleGroupVolume.map((entry) => toNumber(entry.totalVolume)) ?? [0]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        actions={
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
            {rangeOptions.map((option) => (
              <button
                key={option.days}
                className={[
                  "min-h-9 rounded-md px-3 text-sm font-semibold transition",
                  selectedDays === option.days
                    ? "bg-overload-ink text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
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
          accent="green"
          icon={Dumbbell}
          label="Completed workouts"
          value={summary ? formatInteger(summary.workoutCount) : "0"}
        />
        <MetricCard accent="blue" icon={Scale} label="Total volume" value={totalVolumeLabel} />
        <MetricCard
          accent="amber"
          icon={Flame}
          label="Average calories"
          value={
            summary ? formatInteger(summary.nutritionAverages.calories) : "0"
          }
        />
        <MetricCard
          accent="coral"
          icon={Target}
          label="Protein adherence"
          value={
            summary
              ? formatPercent(summary.targetAdherence.proteinAdherencePercent)
              : "0.0%"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <SectionPanel title="Muscle-group volume">
          {summaryQuery.isLoading ? (
            <StatusMessage>Loading volume.</StatusMessage>
          ) : summary?.muscleGroupVolume.length ? (
            <div className="space-y-4">
              {summary.muscleGroupVolume.slice(0, 8).map((entry) => (
                <div key={`${entry.muscleGroup}-${entry.weightUnit}`}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-overload-ink">{entry.muscleGroup}</span>
                    <span className="text-zinc-500">
                      {formatInteger(entry.totalVolume)} {entry.weightUnit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-overload-green"
                      style={{
                        width: `${Math.max(8, (toNumber(entry.totalVolume) / maxMuscleVolume) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatusMessage>No completed workout volume in this range.</StatusMessage>
          )}
        </SectionPanel>

        <SectionPanel title="Nutrition average">
          {summaryQuery.isLoading ? (
            <StatusMessage>Loading nutrition.</StatusMessage>
          ) : summary ? (
            <div className="space-y-4">
              <MacroRow
                label="Protein"
                value={`${formatDecimal(summary.nutritionAverages.proteinGrams)} g`}
                target={`${formatDecimal(summary.targetAdherence.proteinGrams)} g`}
                percent={summary.targetAdherence.proteinAdherencePercent}
              />
              <MacroRow
                label="Carbs"
                value={`${formatDecimal(summary.nutritionAverages.carbsGrams)} g`}
                target={`${formatDecimal(summary.targetAdherence.carbsGrams)} g`}
                percent={summary.targetAdherence.carbsAdherencePercent}
              />
              <MacroRow
                label="Fat"
                value={`${formatDecimal(summary.nutritionAverages.fatGrams)} g`}
                target={`${formatDecimal(summary.targetAdherence.fatGrams)} g`}
                percent={summary.targetAdherence.fatAdherencePercent}
              />
              <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                {summary.nutritionAverages.loggedDays} logged days,{" "}
                {formatInteger(summary.targetAdherence.averageCalorieDelta)} calorie average delta.
              </div>
            </div>
          ) : (
            <StatusMessage>No nutrition data in this range.</StatusMessage>
          )}
        </SectionPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,0.7fr)_minmax(0,1.3fr)]">
        <SectionPanel title="Library snapshot">
          <div className="grid gap-3 sm:grid-cols-3">
            <SnapshotTile icon={Dumbbell} label="Workouts" value={workoutsQuery.data?.length ?? 0} />
            <SnapshotTile icon={Library} label="Exercises" value={exercisesQuery.data?.length ?? 0} />
            <SnapshotTile
              icon={BookOpenCheck}
              label="Programs"
              value={programsQuery.data?.length ?? 0}
            />
          </div>
          {targetQuery.data ? (
            <div className="mt-4 rounded-lg bg-overload-mint px-4 py-3 text-sm text-overload-ink">
              Daily target: {targetQuery.data.dailyCalories.toLocaleString()} calories,{" "}
              {formatDecimal(targetQuery.data.proteinGrams)} g protein.
            </div>
          ) : null}
        </SectionPanel>

        <SectionPanel title="Recent activity">
          {summaryQuery.isLoading ? (
            <StatusMessage>Loading activity.</StatusMessage>
          ) : summary?.recentActivity.length ? (
            <div className="divide-y divide-zinc-100">
              {summary.recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[120px_minmax(0,1fr)_120px]"
                >
                  <span className="font-medium capitalize text-overload-green">
                    {activity.type}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-overload-ink">{activity.title}</p>
                    <p className="truncate text-zinc-500">{activity.subtitle}</p>
                  </div>
                  <span className="text-left text-zinc-500 sm:text-right">
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
        <span className="text-zinc-500">
          {value} / {target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-overload-blue"
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
    <div className="rounded-lg border border-zinc-200 px-4 py-3">
      <Icon className="h-4 w-4 text-overload-green" aria-hidden="true" />
      <p className="mt-3 text-2xl font-semibold text-overload-ink">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
