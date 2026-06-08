import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-overload-background px-6 text-overload-ink">
      <div className="max-w-md rounded-lg border border-overload-border bg-overload-surface p-6 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-overload-accent">
          Overload
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-overload-primary px-4 text-sm font-semibold text-overload-onPrimary"
          to="/"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
