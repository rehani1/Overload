type StatusMessageProps = {
  children: string;
};

export function StatusMessage({ children }: StatusMessageProps) {
  return (
    <div className="rounded-lg border border-overload-border bg-overload-surface-muted px-4 py-3 text-sm text-overload-muted">
      {children}
    </div>
  );
}
