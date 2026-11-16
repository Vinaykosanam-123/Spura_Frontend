'use client';

import { useMemo, useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Algo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

interface SortFrame {
  values: number[];
  compare: number[];
  active: number[];
  sorted: number[];
  pivot: number | null;
  note: string;
  codeLine: number;
  comparisons: number;
  swaps: number;
  writes: number;
  aux?: { left: number[]; right: number[]; merged: number[] };
}

const ALGOS: { id: Algo; label: string; time: string; space: string }[] = [
  { id: 'bubble', label: 'Bubble', time: 'O(n²)', space: 'O(1)' },
  { id: 'selection', label: 'Selection', time: 'O(n²)', space: 'O(1)' },
  { id: 'insertion', label: 'Insertion', time: 'O(n²)', space: 'O(1)' },
  { id: 'merge', label: 'Merge', time: 'O(n log n)', space: 'O(n)' },
  { id: 'quick', label: 'Quick', time: 'O(n log n) avg', space: 'O(log n)' },
];

const CODE: Record<Algo, string[]> = {
  bubble: [
    'for i = 0 to n - 1:',
    '  swapped = false',
    '  for j = 0 to n - i - 2:',
    '    if a[j] > a[j + 1]:',
    '      swap a[j], a[j + 1]',
    '      swapped = true',
    '  if not swapped: break',
    'return a',
  ],
  selection: [
    'for i = 0 to n - 1:',
    '  min = i',
    '  for j = i + 1 to n - 1:',
    '    if a[j] < a[min]: min = j',
    '  swap a[i], a[min]',
    'return a',
  ],
  insertion: [
    'for i = 1 to n - 1:',
    '  key = a[i]',
    '  j = i - 1',
    '  while j >= 0 and a[j] > key:',
    '    a[j + 1] = a[j]',
    '    j = j - 1',
    '  a[j + 1] = key',
    'return a',
  ],
  merge: [
    'mergeSort(a):',
    '  if length <= 1: return a',
    '  mid = length / 2',
    '  left = mergeSort(left half)',
    '  right = mergeSort(right half)',
    '  return merge(left, right)',
    '',
    'merge(left, right):',
    '  result = []',
    '  while left and right:',
    '    take the smaller front value',
    '  append any remaining values',
    '  copy result back into a',
  ],
  quick: [
    'quickSort(a, lo, hi):',
    '  if lo >= hi: return',
    '  pivot = a[hi]',
    '  i = lo',
    '  for j = lo to hi - 1:',
    '    if a[j] < pivot:',
    '      swap a[i], a[j]; i = i + 1',
    '  swap a[i], a[hi]',
    '  quickSort(a, lo, i - 1)',
    '  quickSort(a, i + 1, hi)',
  ],
};

const START = [42, 7, 19, 3, 88, 31, 56, 12];

function frame(
  values: number[],
  note: string,
  codeLine: number,
  opts: Partial<Pick<SortFrame, 'compare' | 'active' | 'sorted' | 'pivot' | 'comparisons' | 'swaps' | 'writes' | 'aux'>> = {}
): SortFrame {
  return {
    values: [...values],
    compare: [...(opts.compare ?? [])],
    active: [...(opts.active ?? [])],
    sorted: [...(opts.sorted ?? [])],
    pivot: opts.pivot ?? null,
    note,
    codeLine,
    comparisons: opts.comparisons ?? 0,
    swaps: opts.swaps ?? 0,
    writes: opts.writes ?? 0,
    aux: opts.aux
      ? { left: [...opts.aux.left], right: [...opts.aux.right], merged: [...opts.aux.merged] }
      : undefined,
  };
}

function buildBubble(values: number[]): SortFrame[] {
  const a = [...values];
  const frames: SortFrame[] = [];
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;
  frames.push(frame(a, `Start with ${a.length} values. Bubble sort repeatedly compares neighbours.`, 0, { comparisons, swaps, sorted }));
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - i - 1; j++) {
      comparisons++;
      frames.push(
        frame(a, `Compare ${a[j]} and ${a[j + 1]}. ${a[j] > a[j + 1] ? 'The left value is larger, so they must swap.' : 'They are already in order.'}`, 3, {
          compare: [j, j + 1],
          sorted,
          comparisons,
          swaps,
        })
      );
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swapped = true;
        frames.push(
          frame(a, `Swap ${a[j + 1]} and ${a[j]}. The larger value moves right.`, 4, {
            compare: [j, j + 1],
            sorted,
            comparisons,
            swaps,
          })
        );
      }
    }
    sorted.push(a.length - 1 - i);
    frames.push(
      frame(a, `${a[a.length - 1 - i]} is now in its final position. The unsorted region shrinks.`, 6, {
        sorted,
        comparisons,
        swaps,
      })
    );
    if (!swapped) {
      for (let k = 0; k < a.length - 1 - i; k++) if (!sorted.includes(k)) sorted.push(k);
      frames.push(frame(a, 'A full pass made no swaps, so the array is already sorted. Early exit.', 6, { sorted, comparisons, swaps }));
      break;
    }
  }
  if (sorted.length < a.length) for (let k = 0; k < a.length; k++) if (!sorted.includes(k)) sorted.push(k);
  frames.push(frame(a, 'Sorted. Bubble sort spent O(n²) comparisons in the worst case and O(1) extra space.', 7, { sorted, comparisons, swaps }));
  return frames;
}

function buildSelection(values: number[]): SortFrame[] {
  const a = [...values];
  const frames: SortFrame[] = [];
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;
  frames.push(frame(a, 'Selection sort grows a sorted prefix by repeatedly finding the smallest remaining value.', 0, { comparisons, swaps, sorted }));
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    frames.push(frame(a, `Pass ${i + 1}: assume ${a[i]} is the smallest remaining value.`, 1, { active: [i], sorted, comparisons, swaps }));
    for (let j = i + 1; j < a.length; j++) {
      comparisons++;
      frames.push(
        frame(a, `Compare ${a[j]} with the current minimum ${a[min]}.`, 3, {
          compare: [j, min],
          active: [i],
          sorted,
          comparisons,
          swaps,
        })
      );
      if (a[j] < a[min]) {
        min = j;
        frames.push(frame(a, `${a[j]} is smaller. The minimum is now at index ${j}.`, 3, { active: [min], sorted, comparisons, swaps }));
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      swaps++;
      frames.push(frame(a, `Swap the minimum ${a[i]} into index ${i}.`, 4, { compare: [i, min], sorted, comparisons, swaps }));
    } else {
      frames.push(frame(a, `${a[i]} is already the minimum. No swap needed.`, 4, { active: [i], sorted, comparisons, swaps }));
    }
    sorted.push(i);
  }
  sorted.push(a.length - 1);
  frames.push(frame(a, 'Sorted. Selection sort always uses O(n²) comparisons, even on an already sorted array.', 5, { sorted, comparisons, swaps }));
  return frames;
}

function buildInsertion(values: number[]): SortFrame[] {
  const a = [...values];
  const frames: SortFrame[] = [];
  let comparisons = 0;
  const swaps = 0;
  let writes = 0;
  const sorted = [0];
  frames.push(frame(a, 'Insertion sort keeps a sorted prefix and inserts each new value into its place.', 0, { comparisons, swaps, writes, sorted }));
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    frames.push(frame(a, `Lift ${key} out of index ${i}. The prefix to its left is already sorted.`, 1, { active: [i], sorted, comparisons, swaps, writes }));
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      comparisons++;
      frames.push(frame(a, `${a[j]} > ${key}, so shift ${a[j]} one slot right.`, 4, { compare: [j], active: [j + 1], sorted, comparisons, swaps, writes }));
      a[j + 1] = a[j];
      writes++;
      j--;
      frames.push(frame(a, `Shifted. Now compare the next value to the left with ${key}.`, 5, { active: [j + 1], sorted, comparisons, swaps, writes }));
    }
    if (j >= 0) comparisons++;
    a[j + 1] = key;
    writes++;
    frames.push(frame(a, `Insert ${key} at index ${j + 1}. The sorted prefix grows to ${i + 1} values.`, 6, { active: [j + 1], sorted: Array.from({ length: i + 1 }, (_, k) => k), comparisons, swaps, writes }));
  }
  frames.push(frame(a, 'Sorted. Insertion sort is fast on nearly sorted data — close to O(n).', 7, { sorted: a.map((_, i) => i), comparisons, swaps, writes }));
  return frames;
}

function buildMerge(values: number[]): SortFrame[] {
  const a = [...values];
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let writes = 0;
  frames.push(frame(a, 'Merge sort divides the array in half, sorts each half, then merges them.', 0, { comparisons, writes }));
  const ms = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    frames.push(frame(a, `Divide indices ${lo}–${hi} into ${lo}–${mid} and ${mid + 1}–${hi}.`, 2, { active: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k), comparisons, writes }));
    ms(lo, mid);
    ms(mid + 1, hi);
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    const merged: number[] = [];
    let i = 0;
    let j = 0;
    let k = lo;
    frames.push(frame(a, `Merge the sorted runs [${left.join(', ')}] and [${right.join(', ')}].`, 5, { active: Array.from({ length: hi - lo + 1 }, (_, x) => lo + x), comparisons, writes, aux: { left, right, merged } }));
    while (i < left.length && j < right.length) {
      comparisons++;
      const takeLeft = left[i] <= right[j];
      frames.push(
        frame(a, `Compare ${left[i]} and ${right[j]}. Take ${takeLeft ? left[i] : right[j]} because it is smaller.`, 10, {
          active: [k],
          comparisons,
          writes,
          aux: { left: left.slice(i), right: right.slice(j), merged },
        })
      );
      a[k] = takeLeft ? left[i++] : right[j++];
      merged.push(a[k]);
      writes++;
      frames.push(frame(a, `Write ${a[k]} into index ${k}.`, 12, { active: [k], comparisons, writes, aux: { left: left.slice(i), right: right.slice(j), merged: [...merged] } }));
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      merged.push(a[k]);
      writes++;
      frames.push(frame(a, `Right run is empty. Append the remaining left value ${a[k]}.`, 11, { active: [k], comparisons, writes, aux: { left: left.slice(i), right: right.slice(j), merged: [...merged] } }));
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      merged.push(a[k]);
      writes++;
      frames.push(frame(a, `Left run is empty. Append the remaining right value ${a[k]}.`, 11, { active: [k], comparisons, writes, aux: { left: left.slice(i), right: right.slice(j), merged: [...merged] } }));
      k++;
    }
    frames.push(frame(a, `Merged run ${lo}–${hi} is now sorted: [${a.slice(lo, hi + 1).join(', ')}].`, 12, { active: Array.from({ length: hi - lo + 1 }, (_, x) => lo + x), comparisons, writes }));
  };
  ms(0, a.length - 1);
  const sorted = a.map((_, i) => i);
  frames.push(frame(a, 'Sorted. Merge sort guarantees O(n log n) time and needs O(n) extra space.', 12, { sorted, comparisons, writes }));
  return frames;
}

function buildQuick(values: number[]): SortFrame[] {
  const a = [...values];
  const frames: SortFrame[] = [];
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;
  frames.push(frame(a, 'Quick sort picks a pivot, partitions smaller values left, then sorts each side.', 0, { comparisons, swaps, sorted }));
  const qs = (lo: number, hi: number) => {
    if (lo >= hi) {
      if (lo === hi && !sorted.includes(lo)) sorted.push(lo);
      return;
    }
    const pivotValue = a[hi];
    frames.push(frame(a, `Choose ${pivotValue} at index ${hi} as the pivot.`, 2, { pivot: hi, active: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k), comparisons, swaps, sorted }));
    let i = lo;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      frames.push(frame(a, `Compare ${a[j]} with pivot ${pivotValue}.`, 5, { pivot: hi, compare: [j], sorted, comparisons, swaps }));
      if (a[j] < pivotValue) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          frames.push(frame(a, `${a[j]} is smaller. Swap it into the left partition at index ${i}.`, 6, { pivot: hi, active: [i], compare: [j], sorted, comparisons, swaps }));
        } else {
          frames.push(frame(a, `${a[j]} is smaller and already in the left partition.`, 6, { pivot: hi, active: [i], sorted, comparisons, swaps }));
        }
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    swaps++;
    sorted.push(i);
    frames.push(frame(a, `Place pivot ${pivotValue} at its final index ${i}.`, 7, { pivot: i, sorted, comparisons, swaps }));
    qs(lo, i - 1);
    qs(i + 1, hi);
  };
  qs(0, a.length - 1);
  for (let k = 0; k < a.length; k++) if (!sorted.includes(k)) sorted.push(k);
  frames.push(frame(a, 'Sorted. Quick sort averages O(n log n); choosing the last element as pivot is O(n²) on sorted input.', 9, { sorted, comparisons, swaps }));
  return frames;
}

function buildFrames(values: number[], algo: Algo): SortFrame[] {
  if (algo === 'bubble') return buildBubble(values);
  if (algo === 'selection') return buildSelection(values);
  if (algo === 'insertion') return buildInsertion(values);
  if (algo === 'merge') return buildMerge(values);
  return buildQuick(values);
}

function parseValues(input: string): number[] | null {
  const parts = input
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 99)) return null;
  return nums.slice(0, 12);
}

export default function SortingVisualizer() {
  const [values, setValues] = useState(START);
  const [algo, setAlgo] = useState<Algo>('bubble');
  const [input, setInput] = useState(START.join(', '));
  const [inputError, setInputError] = useState('');
  const frames = useMemo(() => buildFrames(values, algo), [values, algo]);
  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];
  const meta = ALGOS.find((a) => a.id === algo) ?? ALGOS[0];

  const chooseAlgo = (next: Algo) => {
    setAlgo(next);
    player.restartAndPlay();
  };

  const applyInput = () => {
    const parsed = parseValues(input);
    if (!parsed) {
      setInputError('Enter 2–12 whole numbers between 1 and 99.');
      return;
    }
    setInputError('');
    setValues(parsed);
    player.restartAndPlay();
  };

  const randomize = () => {
    const next: number[] = [];
    while (next.length < 8) {
      const n = 5 + Math.floor(Math.random() * 94);
      if (!next.includes(n)) next.push(n);
    }
    setInput(next.join(', '));
    setValues(next);
    setInputError('');
    player.restartAndPlay();
  };

  const stats =
    algo === 'merge' || algo === 'insertion'
      ? [
          { label: 'Comparisons', value: current.comparisons },
          { label: 'Writes', value: current.writes },
          { label: 'Time', value: meta.time },
          { label: 'Space', value: meta.space },
        ]
      : [
          { label: 'Comparisons', value: current.comparisons },
          { label: 'Swaps', value: current.swaps },
          { label: 'Time', value: meta.time },
          { label: 'Space', value: meta.space },
        ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => chooseAlgo(a.id)}
            aria-pressed={algo === a.id}
            className={`h-9 rounded-full border px-4 text-[13px] transition-colors ${
              algo === a.id
                ? 'border-amber-500 bg-amber-500 font-semibold text-stone-950'
                : 'border-white/10 bg-[#161B24] font-medium text-slate-300 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Custom array</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyInput();
            }}
            placeholder="e.g. 42, 7, 19, 3, 88"
            className="h-10 w-full rounded-xl border border-white/10 bg-[#0F1319] px-3 text-[14px] text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={applyInput}
          className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={randomize}
          className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white"
        >
          Random
        </button>
      </div>
      {inputError && <p className="text-[13px] text-rose-400">{inputError}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            <div className="flex h-[230px] w-full items-end gap-1.5" role="img" aria-label={`${meta.label} sort animation showing ${frames.length} steps`}>
              {current.values.map((v, i) => {
                const isSorted = current.sorted.includes(i);
                const isPivot = current.pivot === i;
                const isCompare = current.compare.includes(i);
                const isActive = current.active.includes(i);
                const color = isPivot
                  ? 'bg-rose-500'
                  : isCompare
                    ? 'bg-amber-400'
                    : isActive
                      ? 'bg-orange-400'
                      : isSorted
                        ? 'bg-emerald-500'
                        : 'bg-slate-600';
                return (
                  <div
                    key={`${i}-${v}`}
                    className={`min-w-[10px] flex-1 rounded-t-md transition-[height,background-color] duration-200 ${color}`}
                    style={{ height: `${Math.max(10, (v / 99) * 100)}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex w-full gap-1.5">
              {current.values.map((v, i) => (
                <span
                  key={`${i}-${v}`}
                  className={`flex-1 text-center text-[11px] tabular-nums ${
                    current.compare.includes(i) || current.pivot === i
                      ? 'font-semibold text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> compare</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400" /> active</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> pivot</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> sorted</span>
            </div>
            {current.aux && (
              <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-[#0F1319] p-3 text-[12px]">
                <AuxRow label="Left" values={current.aux.left} tone="teal" />
                <AuxRow label="Right" values={current.aux.right} tone="amber" />
                <AuxRow label="Merged" values={current.aux.merged} tone="emerald" />
              </div>
            )}
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
        code={CODE[algo]}
        codeLine={current.codeLine}
        stats={stats}
      />
    </div>
  );
}

function AuxRow({ label, values, tone }: { label: string; values: number[]; tone: 'teal' | 'amber' | 'emerald' }) {
  const colors = {
    teal: 'border border-teal-500/30 bg-teal-500/15 text-teal-200',
    amber: 'border border-amber-500/30 bg-amber-500/15 text-amber-200',
    emerald: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-slate-400">{label}</span>
      <div className="flex min-h-6 flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-slate-600">empty</span>
        ) : (
          values.map((v, i) => (
            <span key={`${v}-${i}`} className={`rounded px-1.5 py-0.5 tabular-nums ${colors[tone]}`}>
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
