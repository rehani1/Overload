import { useQuery } from "@tanstack/react-query";

import { getWorkouts } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import { formatDate } from "../lib/format";

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Date</th>
                  <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Title</th>
                  <th className="border-b border-zinc-200 py-3 pr-4 font-semibold">Status</th>
                  <th className="border-b border-zinc-200 py-3 font-semibold">Exercises</th>
                </tr>
              </thead>
              <tbody>
                {workoutsQuery.data.map((workout) => (
                  <tr key={workout.id}>
                    <td className="border-b border-zinc-100 py-3 pr-4 text-zinc-600">
                      {formatDate(workout.date)}
                    </td>
                    <td className="border-b border-zinc-100 py-3 pr-4 font-medium text-overload-ink">
                      {workout.title}
                    </td>
                    <td className="border-b border-zinc-100 py-3 pr-4 capitalize text-zinc-600">
                      {workout.status}
                    </td>
                    <td className="border-b border-zinc-100 py-3 text-zinc-600">
                      {workout.exercises.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <StatusMessage>No workouts found.</StatusMessage>
        )}
      </SectionPanel>
    </>
  );
}
