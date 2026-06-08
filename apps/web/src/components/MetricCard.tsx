import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  accent?: "amber" | "blue" | "coral" | "green" | "nutrition" | "primary" | "workout";
  icon: LucideIcon;
  label: string;
  value: string;
};

const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  amber: "bg-overload-coral text-overload-onPrimary",
  blue: "bg-overload-accent text-overload-onPrimary",
  coral: "bg-overload-coral text-overload-onPrimary",
  green: "bg-overload-success text-overload-onPrimary",
  nutrition: "bg-overload-nutrition text-overload-onPrimary",
  primary: "bg-overload-primary text-overload-onPrimary",
  workout: "bg-overload-workout text-overload-onPrimary",
};

export function MetricCard({ accent = "green", icon: Icon, label, value }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-overload-border bg-overload-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-overload-primary">{label}</p>
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
