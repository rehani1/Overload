import type { ReactNode } from "react";

type SectionPanelProps = {
  children: ReactNode;
  title: string;
};

export function SectionPanel({ children, title }: SectionPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-overload-border bg-overload-surface shadow-sm">
      <div className="h-1 bg-overload-primary" />
      <div className="p-5">
        <h3 className="text-base font-semibold text-overload-primary">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}
