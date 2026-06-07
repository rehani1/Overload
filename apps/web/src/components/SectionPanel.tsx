import type { ReactNode } from "react";

type SectionPanelProps = {
  children: ReactNode;
  title: string;
};

export function SectionPanel({ children, title }: SectionPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-overload-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
