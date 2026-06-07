import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getExercises } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";

export function ExercisesPage() {
  const exercisesQuery = useQuery({ queryKey: ["exercises"], queryFn: getExercises });
  const muscleGroups = useMemo(
    () =>
      Array.from(new Set(exercisesQuery.data?.map((exercise) => exercise.muscleGroup))).sort(),
    [exercisesQuery.data],
  );

  return (
    <>
      <PageHeader eyebrow="Library" title="Exercises" />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionPanel title="Muscle groups">
          {muscleGroups.length ? (
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((group) => (
                <span
                  key={group}
                  className="rounded-lg bg-overload-mint px-3 py-2 text-sm font-medium text-overload-ink"
                >
                  {group}
                </span>
              ))}
            </div>
          ) : (
            <StatusMessage>No exercise groups found.</StatusMessage>
          )}
        </SectionPanel>

        <SectionPanel title="Exercise list">
          {exercisesQuery.isLoading ? (
            <StatusMessage>Loading exercises.</StatusMessage>
          ) : exercisesQuery.isError ? (
            <StatusMessage>Unable to load exercises from the API.</StatusMessage>
          ) : exercisesQuery.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Name</th>
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">
                      Muscle group
                    </th>
                    <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">
                      Equipment
                    </th>
                    <th className="border-b border-zinc-200 py-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {exercisesQuery.data.map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="border-b border-zinc-100 py-3 pr-4 font-medium text-overload-ink">
                        {exercise.name}
                      </td>
                      <td className="border-b border-zinc-100 py-3 pr-4 text-zinc-600">
                        {exercise.muscleGroup}
                      </td>
                      <td className="border-b border-zinc-100 py-3 pr-4 text-zinc-600">
                        {exercise.equipment}
                      </td>
                      <td className="border-b border-zinc-100 py-3 text-zinc-600">
                        {exercise.isCustom ? "Custom" : "Default"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatusMessage>No exercises found.</StatusMessage>
          )}
        </SectionPanel>
      </div>
    </>
  );
}
