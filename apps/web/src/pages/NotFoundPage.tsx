import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] px-6 text-overload-ink">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-overload-green">
          Overload
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-overload-ink px-4 text-sm font-semibold text-white"
          to="/"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
