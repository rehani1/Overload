import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  heading: string;
  subheading: string;
};

export function AuthShell({ children, heading, subheading }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-overload-background text-overload-ink lg:grid lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
      <section className="flex min-h-[260px] flex-col justify-between bg-overload-primary px-6 py-8 text-overload-onPrimary lg:min-h-screen lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-overload-primary-muted">
            Overload
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-normal lg:text-5xl">
            Training Desk
          </h1>
        </div>

        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-sm text-white/78">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold text-white">Local</p>
            <p className="mt-1">Mobile-first logging</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold text-white">4/4/9</p>
            <p className="mt-1">Macro-derived calories</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-8 lg:px-10">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold tracking-normal">{heading}</h2>
            <p className="mt-2 text-sm text-overload-muted">{subheading}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
