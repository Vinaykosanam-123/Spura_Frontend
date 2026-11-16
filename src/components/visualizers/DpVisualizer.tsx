'use client';

import { useMemo, useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type ProblemMode = 'stairs' | 'knapsack';

interface DpFrame {
  mode: ProblemMode;
  table1d?: (number | null)[];
  table2d?: (number | null)[][];
  target: [number, number] | null;
  deps: [number, number][];
  note: string;
  codeLine: number;
}

const CODE: Record<ProblemMode, string[]> = {
  stairs: [
    'dp[0] = 1; dp[1] = 1',
    'for i = 2 to n:',
    '  take1 = dp[i - 1]',
    '  take2 = dp[i - 2]',
    '  dp[i] = take1 + take2',
    'return dp[n]',
  ],
  knapsack: [
    'init dp[0..n][0..W] = 0',
    'for i = 1 to n:',
    '  for w = 1 to W:',
    '    skip = dp[i - 1][w]',
    '    if wt[i] <= w: take = val[i] + dp[i - 1][w - wt[i]]',
    '    dp[i][w] = max(skip, take)',
    'return dp[n][W]',
  ],
};

function buildStairs(n: number): DpFrame[] {
  const dp: (number | null)[] = Array(n + 1).fill(null);
  dp[0] = 1;
  dp[1] = 1;
  const frames: DpFrame[] = [
    {
      mode: 'stairs',
      table1d: [...dp],
      target: null,
      deps: [[0, 0], [0, 1]],
      note: 'Base cases: 1 way to stay at step 0, 1 way to reach step 1.',
      codeLine: 0,
    },
  ];
  for (let i = 2; i <= n; i++) {
    frames.push({
      mode: 'stairs',
      table1d: [...dp],
      target: [0, i],
      deps: [[0, i - 1], [0, i - 2]],
      note: `Computing dp[${i}]: sum dp[${i - 1}] (${dp[i - 1]}) + dp[${i - 2}] (${dp[i - 2]}).`,
      codeLine: 2,
    });
    dp[i] = (dp[i - 1] ?? 0) + (dp[i - 2] ?? 0);
    frames.push({
      mode: 'stairs',
      table1d: [...dp],
      target: [0, i],
      deps: [[0, i - 1], [0, i - 2]],
      note: `Filled dp[${i}] = ${dp[i]} ways to climb ${i} stairs.`,
      codeLine: 4,
    });
  }
  frames.push({
    mode: 'stairs',
    table1d: [...dp],
    target: [0, n],
    deps: [],
    note: `Done! Total ways to reach step ${n} is dp[${n}] = ${dp[n]}.`,
    codeLine: 5,
  });
  return frames;
}

const KS_ITEMS = [
  { name: 'Watch', wt: 1, val: 6 },
  { name: 'Book', wt: 2, val: 10 },
  { name: 'Laptop', wt: 3, val: 12 },
];
const KS_CAP = 5;

function buildKnapsack(): DpFrame[] {
  const rows = KS_ITEMS.length + 1;
  const cols = KS_CAP + 1;
  const dp: (number | null)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (r === 0 || c === 0 ? 0 : null))
  );
  const frames: DpFrame[] = [
    {
      mode: 'knapsack',
      table2d: dp.map((row) => [...row]),
      target: null,
      deps: [],
      note: 'Row 0 and Col 0 initialized to 0 (no items or 0 capacity yields value 0).',
      codeLine: 0,
    },
  ];

  for (let i = 1; i < rows; i++) {
    const item = KS_ITEMS[i - 1];
    for (let w = 1; w < cols; w++) {
      const skip = dp[i - 1][w] ?? 0;
      const canTake = item.wt <= w;
      const takeVal = canTake ? item.val + (dp[i - 1][w - item.wt] ?? 0) : -1;
      const deps: [number, number][] = canTake
        ? [[i - 1, w], [i - 1, w - item.wt]]
        : [[i - 1, w]];

      dp[i][w] = Math.max(skip, canTake ? takeVal : 0);
      frames.push({
        mode: 'knapsack',
        table2d: dp.map((row) => [...row]),
        target: [i, w],
        deps,
        note: canTake
          ? `${item.name} (wt=${item.wt}, val=${item.val}) at cap ${w}: max(skip=${skip}, take=${takeVal}) = ${dp[i][w]}.`
          : `${item.name} too heavy (wt=${item.wt} > ${w}): inherit skip dp[${i - 1}][${w}] = ${skip}.`,
        codeLine: canTake ? 5 : 3,
      });
    }
  }
  frames.push({
    mode: 'knapsack',
    table2d: dp.map((row) => [...row]),
    target: [KS_ITEMS.length, KS_CAP],
    deps: [],
    note: `Optimal 0/1 Knapsack value for capacity ${KS_CAP} is dp[${KS_ITEMS.length}][${KS_CAP}] = ${dp[KS_ITEMS.length][KS_CAP]}.`,
    codeLine: 6,
  });
  return frames;
}

export default function DpVisualizer() {
  const [mode, setMode] = useState<ProblemMode>('stairs');
  const [stairsN, setStairsN] = useState(6);

  const frames = useMemo(
    () => (mode === 'stairs' ? buildStairs(stairsN) : buildKnapsack()),
    [mode, stairsN]
  );

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];

  const isCoord = (list: [number, number][], r: number, c: number) =>
    list.some(([lr, lc]) => lr === r && lc === c);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-white/10 bg-[#0F1319] p-0.5">
          <button
            type="button"
            onClick={() => {
              setMode('stairs');
              player.restartAndPlay();
            }}
            className={`h-8 rounded-full px-4 text-[13px] transition-colors ${
              mode === 'stairs' ? 'bg-amber-500 font-semibold text-stone-950' : 'font-medium text-slate-300 hover:text-white'
            }`}
          >
            Climbing Stairs (1D)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('knapsack');
              player.restartAndPlay();
            }}
            className={`h-8 rounded-full px-4 text-[13px] transition-colors ${
              mode === 'knapsack' ? 'bg-amber-500 font-semibold text-stone-950' : 'font-medium text-slate-300 hover:text-white'
            }`}
          >
            0/1 Knapsack (2D)
          </button>
        </div>

        {mode === 'stairs' && (
          <label className="flex items-center gap-2 text-[13px] text-slate-300">
            Steps (n):
            <select
              value={stairsN}
              onChange={(e) => {
                setStairsN(Number(e.target.value));
                player.restartAndPlay();
              }}
              className="h-9 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-[13px] text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              {[4, 5, 6, 7, 8].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            {current.mode === 'stairs' && current.table1d && (
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  1D DP Table — Ways to Climb Step i
                </p>
                <div className="flex flex-wrap gap-2">
                  {current.table1d.map((val, i) => {
                    const isTarget = current.target?.[1] === i;
                    const isDep = isCoord(current.deps, 0, i);
                    return (
                      <div
                        key={i}
                        className={`min-w-[60px] rounded-xl border-2 px-3 py-2 text-center transition-colors ${
                          isTarget
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : isDep
                              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                              : val !== null
                                ? 'border-white/15 bg-[#161B24] text-slate-100'
                                : 'border-dashed border-white/10 bg-[#090C10] text-slate-600'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">dp[{i}]</div>
                        <div className="mt-0.5 text-[16px] font-bold tabular-nums">{val ?? '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {current.mode === 'knapsack' && current.table2d && (
              <div className="space-y-3 overflow-x-auto">
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {KS_ITEMS.map((it, idx) => (
                    <span key={it.name} className="rounded-lg border border-white/10 bg-[#161B24] px-2.5 py-1">
                      #{idx + 1} {it.name}: wt {it.wt}, val {it.val}
                    </span>
                  ))}
                </div>
                <table className="w-full border-collapse text-center text-[13px] font-mono">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="p-2 text-left text-[11px]">Item \ Cap</th>
                      {Array.from({ length: KS_CAP + 1 }, (_, w) => (
                        <th key={w} className="p-2 text-[11px]">
                          w={w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {current.table2d.map((row, r) => (
                      <tr key={r}>
                        <td className="p-2 text-left text-[11px] font-semibold text-slate-300">
                          {r === 0 ? 'None' : KS_ITEMS[r - 1].name}
                        </td>
                        {row.map((cell, c) => {
                          const isTarget = current.target?.[0] === r && current.target?.[1] === c;
                          const isDep = isCoord(current.deps, r, c);
                          return (
                            <td
                              key={c}
                              className={`border border-white/10 p-2 font-bold tabular-nums transition-colors ${
                                isTarget
                                  ? 'bg-amber-500/25 text-amber-200 ring-2 ring-amber-400'
                                  : isDep
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : cell !== null
                                      ? 'bg-[#161B24] text-slate-100'
                                      : 'bg-[#090C10] text-slate-600'
                              }`}
                            >
                              {cell ?? '·'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> active cell
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> subproblem dependencies
              </span>
            </div>
          </div>
        }
        controls={
          <PlayerControls
            index={player.index}
            total={player.total}
            playing={player.playing}
            speed={player.speed}
            atStart={player.atStart}
            atEnd={player.atEnd}
            onToggle={player.toggle}
            onNext={player.next}
            onPrev={player.prev}
            onReset={player.reset}
            onSpeed={player.setSpeed}
          />
        }
        note={current.note}
        code={CODE[mode]}
        codeLine={current.codeLine}
        stats={[
          { label: 'Table shape', value: mode === 'stairs' ? `1 × ${stairsN + 1}` : `4 × ${KS_CAP + 1}` },
          { label: 'Step', value: `${player.index + 1} / ${frames.length}` },
          { label: 'Time', value: mode === 'stairs' ? 'O(n)' : 'O(n·W)' },
          { label: 'Approach', value: 'Bottom-up' },
        ]}
      />
    </div>
  );
}
