import { useQuery } from "@tanstack/react-query";

import { getPrograms } from "../api/resources";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { StatusMessage } from "../components/StatusMessage";
import { formatDate } from "../lib/format";

export function ProgramsPage() {
  const programsQuery = useQuery({ queryKey: ["programs"], queryFn: getPrograms });

  return (
    <>
      <PageHeader eyebrow="Planning" title="Programs" />

      <SectionPanel title="Saved programs">
        {programsQuery.isLoading ? (
          <StatusMessage>Loading programs.</StatusMessage>
        ) : programsQuery.isError ? (
          <StatusMessage>Unable to load programs from the API.</StatusMessage>
        ) : programsQuery.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programsQuery.data.map((program) => (
              <article key={program.id} className="rounded-lg border border-zinc-200 p-4">
                <h3 className="font-semibold text-overload-ink">{program.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{program.goal}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Updated {formatDate(program.updatedAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <StatusMessage>No programs found.</StatusMessage>
        )}
      </SectionPanel>
    </>
  );
}
