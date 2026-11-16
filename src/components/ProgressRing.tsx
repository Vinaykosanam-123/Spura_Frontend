export default function ProgressRing({
  value,
  max,
  size = 72,
}: {
  value: number;
  max: number;
  size?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-4" role="img" aria-label={`${pct}% complete (${value} of ${max} lessons)`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-stone-200 dark:stroke-stone-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-emerald-700 dark:stroke-emerald-400 transition-all"
        />
      </svg>
      <div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 leading-none tracking-tight">{pct}%</p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {value}/{max} lessons
        </p>
      </div>
    </div>
  );
}
