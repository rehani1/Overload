type FullScreenStateProps = {
  title: string;
};

export function FullScreenState({ title }: FullScreenStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f5] px-6 text-overload-ink">
      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-panel">
        <p className="text-sm font-semibold">{title}</p>
      </div>
    </div>
  );
}
