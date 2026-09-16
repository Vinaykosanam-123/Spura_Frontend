export default function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
          <span className="text-zinc-500">
            {value}/{max} ({pct}%)
          </span>
        </div>
      )}
      <div
        className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'progress'}
      >
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
