'use client';

interface Props {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  atStart: boolean;
  atEnd: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeed: (speed: number) => void;
}

const btn =
  'inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-[#161B24] px-3 text-[13px] font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40';

export default function PlayerControls({
  index,
  total,
  playing,
  speed,
  atStart,
  atEnd,
  onToggle,
  onNext,
  onPrev,
  onReset,
  onSpeed,
}: Props) {
  const progress = total <= 1 ? 0 : (index / (total - 1)) * 100;
  if (total <= 1) {
    return (
      <div className="border-t border-white/10 bg-[#0F1319] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-slate-400">Choose an operation above to animate step-by-step.</p>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Ready
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="border-t border-white/10 bg-[#0F1319] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPrev} disabled={atStart} className={btn} aria-label="Previous step">
          ←
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-lg bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 transition-colors hover:bg-amber-400"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '❚❚ Pause' : atEnd ? '↻ Replay' : '▶ Play'}
        </button>
        <button type="button" onClick={onNext} disabled={atEnd} className={btn} aria-label="Next step">
          →
        </button>
        <button type="button" onClick={onReset} className={btn}>
          Reset
        </button>
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
          Step {total === 0 ? 0 : index + 1} / {total}
        </span>
        <label className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <span className="sr-only">Playback speed</span>
          <select
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
            className="h-8 rounded-lg border border-white/10 bg-[#161B24] px-2 text-[12px] text-slate-200 focus:border-amber-500 focus:outline-none"
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
