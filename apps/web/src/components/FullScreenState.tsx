type FullScreenStateProps = {
  title: string;
};

export function FullScreenState({ title }: FullScreenStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-overload-background px-6 text-overload-ink">
      <div className="rounded-lg border border-overload-border bg-overload-surface px-5 py-4 shadow-panel">
        <p className="text-sm font-semibold">{title}</p>
      </div>
    </div>
  );
}
