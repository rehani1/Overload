type StatusMessageProps = {
  children: string;
};

export function StatusMessage({ children }: StatusMessageProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
      {children}
    </div>
  );
}
