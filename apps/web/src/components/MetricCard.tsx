import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  accent?: "amber" | "blue" | "coral" | "green";
  icon: LucideIcon;
  label: string;
  value: string;
};

const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  amber: "bg-amber-50 text-overload-amber",
  blue: "bg-blue-50 text-overload-blue",
  coral: "bg-red-50 text-overload-coral",
  green: "bg-emerald-50 text-overload-green",
};

export function MetricCard({ accent = "green", icon: Icon, label, value }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-3 truncate text-3xl font-semibold tracking-normal text-overload-ink">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
