import { useQuery } from "@tanstack/react-query";

import { getNutritionEntries, getNutritionTarget } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import { formatDate, formatDecimal } from "../lib/format";

export function NutritionPage() {
  const targetQuery = useQuery({
    queryKey: ["nutrition-target"],
    queryFn: getNutritionTarget,
  });
  const entriesQuery = useQuery({
    queryKey: ["nutrition-entries"],
    queryFn: getNutritionEntries,
  });

  return (
    <>
      <PageHeader eyebrow="Intake" title="Nutrition" />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionPanel title="Current target">
          {targetQuery.isLoading ? (
            <StatusMessage>Loading target.</StatusMessage>
          ) : targetQuery.isError ? (
            <StatusMessage>Unable to load nutrition target.</StatusMessage>
          ) : targetQuery.data ? (
            <div className="space-y-3 text-sm">
              <TargetRow label="Calories" value={targetQuery.data.dailyCalories.toLocaleString()} />
              <TargetRow
                label="Protein"
                value={`${formatDecimal(targetQuery.data.proteinGrams)} g`}
              />
              <TargetRow label="Carbs" value={`${formatDecimal(targetQuery.data.carbsGrams)} g`} />
              <TargetRow label="Fat" value={`${formatDecimal(targetQuery.data.fatGrams)} g`} />
            </div>
          ) : (
            <StatusMessage>No target found.</StatusMessage>
          )}
        </SectionPanel>

        <SectionPanel title="Logged food">
          {entriesQuery.isLoading ? (
            <StatusMessage>Loading entries.</StatusMessage>
          ) : entriesQuery.isError ? (
            <StatusMessage>Unable to load nutrition entries.</StatusMessage>
          ) : entriesQuery.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Date</th>
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Meal</th>
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Food</th>
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">
                      Calories
                    </th>
                    <th className="border-b border-zinc-200 py-3 font-semibold">Macros</th>
                  </tr>
                </thead>
                <tbody>
                  {entriesQuery.data.slice(0, 25).map((entry) => (
                    <tr key={entry.id}>
                      <td className="border-b border-zinc-100 py-3 pr-4 text-zinc-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="border-b border-zinc-100 py-3 pr-4 capitalize text-zinc-600">
                        {entry.mealType}
                      </td>
                      <td className="border-b border-zinc-100 py-3 pr-4 font-medium text-overload-ink">
                        {entry.foodName}
                      </td>
                      <td className="border-b border-zinc-100 py-3 pr-4 text-zinc-600">
                        {entry.calories.toLocaleString()}
                      </td>
                      <td className="border-b border-zinc-100 py-3 text-zinc-600">
                        {formatDecimal(entry.proteinGrams)}p / {formatDecimal(entry.carbsGrams)}c /{" "}
                        {formatDecimal(entry.fatGrams)}f
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatusMessage>No nutrition entries found.</StatusMessage>
          )}
        </SectionPanel>
      </div>
    </>
  );
}

type TargetRowProps = {
  label: string;
  value: string;
};

function TargetRow({ label, value }: TargetRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-4 py-3">
      <span className="font-medium text-zinc-600">{label}</span>
      <span className="font-semibold text-overload-ink">{value}</span>
    </div>
  );
}
