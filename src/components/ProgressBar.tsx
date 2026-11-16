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
          <span className="text-stone-700 dark:text-stone-300">{label}</span>
          <span className="text-stone-500">
            {value}/{max} ({pct}%)
          </span>
        </div>
      )}
      <div
        className="h-2 rounded-xl bg-stone-200 dark:bg-stone-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'progress'}
      >
        <div className="h-full rounded-xl bg-emerald-700 dark:bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
