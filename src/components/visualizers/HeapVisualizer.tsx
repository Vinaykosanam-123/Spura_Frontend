'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Mode = 'min' | 'max';
type Op = 'insert' | 'extract';

interface HeapFrame {
  heap: number[];
  compare: number[];
  swapped: number[];
  highlight: number | null;
  note: string;
  codeLine: number;
  swaps: number;
}

const CODE: Record<Op, string[]> = {
  insert: [
    'heap.push(value)',
    'i = heap.length - 1',
    'while i > 0:',
    '  p = Math.floor((i - 1) / 2)',
    '  if shouldSwap(heap[p], heap[i]):',
    '    swap(heap[p], heap[i]); i = p',
    '  else: break',
  ],
  extract: [
    'root = heap[0]',
    'heap[0] = heap.pop()',
    'i = 0',
    'while hasChild(i):',
    '  best = pickBetterChild(i)',
    '  if shouldSwap(heap[i], heap[best]):',
    '    swap(heap[i], heap[best]); i = best',
    '  else: break',
  ],
};

const START_MIN = [10, 18, 24, 35, 42, 30, 50];

function better(a: number, b: number, mode: Mode): boolean {
  return mode === 'min' ? a < b : a > b;
}

function heapifyAll(arr: number[], mode: Mode): number[] {
  const h = [...arr];
  for (let start = Math.floor(h.length / 2) - 1; start >= 0; start--) {
    let i = start;
    while (true) {
      let best = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < h.length && better(h[l], h[best], mode)) best = l;
      if (r < h.length && better(h[r], h[best], mode)) best = r;
      if (best === i) break;
      [h[i], h[best]] = [h[best], h[i]];
      i = best;
    }
  }
  return h;
}

function buildInsert(initial: number[], val: number, mode: Mode): { frames: HeapFrame[]; nextHeap: number[] } {
  const h = [...initial, val];
  const frames: HeapFrame[] = [];
  let swaps = 0;
  let i = h.length - 1;
  frames.push({
    heap: [...h],
    compare: [i],
    swapped: [],
    highlight: i,
    note: `Append ${val} at index ${i} (next open leaf) to preserve complete binary tree shape.`,
    codeLine: 0,
    swaps,
  });

  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    frames.push({
      heap: [...h],
      compare: [p, i],
      swapped: [],
      highlight: i,
      note: `Compare child a[${i}]=${h[i]} with parent a[${p}]=${h[p]}.`,
      codeLine: 4,
      swaps,
    });
    if (better(h[i], h[p], mode)) {
      [h[p], h[i]] = [h[i], h[p]];
      swaps++;
      frames.push({
        heap: [...h],
        compare: [],
        swapped: [p, i],
        highlight: p,
        note: `Sift up: ${h[p]} beats ${h[i]} for ${mode}-heap order, so swap indices ${p} and ${i}.`,
        codeLine: 5,
        swaps,
      });
      i = p;
    } else {
      frames.push({
        heap: [...h],
        compare: [p, i],
        swapped: [],
        highlight: i,
        note: `${mode === 'min' ? 'Parent <= child' : 'Parent >= child'}. Heap property restored after ${swaps} swap(s).`,
        codeLine: 6,
        swaps,
      });
      return { frames, nextHeap: h };
    }
  }
  frames.push({
    heap: [...h],
    compare: [],
    swapped: [],
    highlight: 0,
    note: `${val} reached the root (index 0). Sift-up complete.`,
    codeLine: 6,
    swaps,
  });
  return { frames, nextHeap: h };
}

function buildExtract(initial: number[], mode: Mode): { frames: HeapFrame[]; nextHeap: number[] } {
  if (initial.length === 0) {
    return {
      frames: [{ heap: [], compare: [], swapped: [], highlight: null, note: 'Heap is empty.', codeLine: 0, swaps: 0 }],
      nextHeap: [],
    };
  }
  const h = [...initial];
  const rootVal = h[0];
  if (h.length === 1) {
    return {
      frames: [{ heap: [], compare: [], swapped: [], highlight: null, note: `Extracted root ${rootVal}. Heap is now empty.`, codeLine: 1, swaps: 0 }],
      nextHeap: [],
    };
  }
  const frames: HeapFrame[] = [];
  let swaps = 0;
  frames.push({
    heap: [...h],
    compare: [],
    swapped: [],
    highlight: 0,
    note: `Remove root ${rootVal} and move the last leaf (${h[h.length - 1]}) to index 0.`,
    codeLine: 0,
    swaps,
  });
  h[0] = h.pop()!;
  let i = 0;
  frames.push({
    heap: [...h],
    compare: [],
    swapped: [0],
    highlight: 0,
    note: `Placed ${h[0]} at index 0. Begin sift-down from the root.`,
    codeLine: 1,
    swaps,
  });

  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l >= h.length) break;
    let best = l;
    if (r < h.length && better(h[r], h[l], mode)) best = r;
    frames.push({
      heap: [...h],
      compare: [i, best],
      swapped: [],
      highlight: i,
      note: `Compare node a[${i}]=${h[i]} with preferred child a[${best}]=${h[best]}.`,
      codeLine: 5,
      swaps,
    });
    if (better(h[best], h[i], mode)) {
      [h[i], h[best]] = [h[best], h[i]];
      swaps++;
      frames.push({
        heap: [...h],
        compare: [],
        swapped: [i, best],
        highlight: best,
        note: `Sift down: swap a[${i}]=${h[i]} with a[${best}]=${h[best]}.`,
        codeLine: 6,
        swaps,
      });
      i = best;
    } else {
      break;
    }
  }
  frames.push({
    heap: [...h],
    compare: [],
    swapped: [],
    highlight: null,
    note: `Extracted ${rootVal}. Heap order restored in O(log n) (${swaps} swap(s)).`,
    codeLine: 7,
    swaps,
  });
  return { frames, nextHeap: h };
}

function coordsForHeap(len: number): { x: number; y: number }[] {
  const levels = Math.max(1, Math.floor(Math.log2(Math.max(1, len))) + 1);
  return Array.from({ length: len }, (_, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (2 ** level - 1);
    const countInLevel = 2 ** level;
    const x = ((indexInLevel + 0.5) / countInLevel) * 620 + 40;
    const y = 40 + level * (levels <= 3 ? 85 : 70);
    return { x, y };
  });
}

export default function HeapVisualizer() {
  const [mode, setMode] = useState<Mode>('min');
  const [heap, setHeap] = useState<number[]>(() => heapifyAll(START_MIN, 'min'));
  const [op, setOp] = useState<Op>('insert');
  const [input, setInput] = useState('14');
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<HeapFrame[]>([
    {
      heap: heapifyAll(START_MIN, 'min'),
      compare: [],
      swapped: [],
      highlight: 0,
      note: 'A binary heap stores a complete binary tree inside a flat array: children of i live at 2i+1 and 2i+2.',
      codeLine: 0,
      swaps: 0,
    },
  ]);

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];
  const coords = coordsForHeap(current.heap.length);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    const next = heapifyAll(heap, nextMode);
    setHeap(next);
    setFrames([
      {
        heap: next,
        compare: [],
        swapped: [],
        highlight: 0,
        note: `Switched to ${nextMode}-heap: root is always the ${nextMode === 'min' ? 'smallest' : 'largest'} element.`,
        codeLine: 0,
        swaps: 0,
      },
    ]);
    player.reset();
  };

  const runInsert = () => {
    const val = Number(input);
    if (!Number.isInteger(val) || val < 1 || val > 99) {
      setError('Enter a whole number between 1 and 99.');
      return;
    }
    if (heap.length >= 15) {
      setError('Heap holds up to 15 elements in this demo. Extract or reset first.');
      return;
    }
    setError('');
    setOp('insert');
    const res = buildInsert(heap, val, mode);
    setHeap(res.nextHeap);
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const runExtract = () => {
    setError('');
    setOp('extract');
    const res = buildExtract(heap, mode);
    setHeap(res.nextHeap);
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const reset = () => {
    const init = heapifyAll(START_MIN, mode);
    setHeap(init);
    setError('');
    setOp('insert');
    setFrames([
      {
        heap: init,
        compare: [],
        swapped: [],
        highlight: 0,
        note: 'Reset heap. Parent relationships map directly between the tree and the 0-indexed array below.',
        codeLine: 0,
        swaps: 0,
      },
    ]);
    player.reset();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-white/10 bg-[#0F1319] p-0.5">
          {(['min', 'max'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`h-8 rounded-full px-4 text-[13px] capitalize transition-colors ${
                mode === m ? 'bg-amber-500 font-semibold text-stone-950' : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              {m}-heap
            </button>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runInsert()}
          inputMode="numeric"
          className="h-10 w-20 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
          aria-label="Value to insert into heap"
        />
        <button type="button" onClick={runInsert} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert
        </button>
        <button type="button" onClick={runExtract} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Extract root
        </button>
        <button type="button" onClick={reset} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl space-y-5">
            <svg viewBox="0 0 700 280" className="mx-auto h-auto w-full max-w-[680px]" role="img" aria-label={`${mode} heap tree`}>
              {current.heap.map((_, i) => {
                if (i === 0) return null;
                const p = Math.floor((i - 1) / 2);
                const cNode = coords[i];
                const pNode = coords[p];
                if (!cNode || !pNode) return null;
                const activeEdge =
                  (current.compare.includes(i) && current.compare.includes(p)) ||
                  (current.swapped.includes(i) && current.swapped.includes(p));
                return (
                  <line
                    key={`e-${p}-${i}`}
                    x1={pNode.x}
                    y1={pNode.y}
                    x2={cNode.x}
                    y2={cNode.y}
                    className={activeEdge ? 'stroke-amber-400' : 'stroke-slate-700'}
                    strokeWidth={activeEdge ? 3 : 2}
                  />
                );
              })}
              {current.heap.map((v, i) => {
                const pos = coords[i];
                if (!pos) return null;
                const isSwapped = current.swapped.includes(i);
                const isCompare = current.compare.includes(i);
                const isHi = current.highlight === i;
                const cls = isSwapped
                  ? 'fill-emerald-500 stroke-emerald-400'
                  : isCompare || isHi
                    ? 'fill-amber-400 stroke-amber-300'
                    : 'fill-[#161B24] stroke-slate-600';
                const txtCls = isSwapped || isCompare || isHi ? 'fill-stone-950 font-bold' : 'fill-slate-100 font-semibold';
                return (
                  <g key={`n-${i}-${v}`}>
                    <circle cx={pos.x} cy={pos.y} r={20} strokeWidth={2} className={cls} />
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className={`text-[13px] ${txtCls}`}>
                      {v}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Backing Array Representation (0-indexed)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {current.heap.map((v, i) => {
                  const isSwapped = current.swapped.includes(i);
                  const isCompare = current.compare.includes(i);
                  return (
                    <div
                      key={`arr-${i}-${v}`}
                      className={`min-w-[44px] rounded-xl border px-2.5 py-1.5 text-center transition-colors ${
                        isSwapped
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : isCompare
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 bg-[#161B24] text-slate-200'
                      }`}
                    >
                      <div className="text-[14px] font-bold tabular-nums">{v}</div>
                      <div className="text-[10px] text-slate-400">[{i}]</div>
                    </div>
                  );
                })}
              </div>
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
        code={CODE[op]}
        codeLine={current.codeLine}
        stats={[
          { label: 'Size', value: current.heap.length },
          { label: 'Root', value: current.heap[0] ?? 'empty' },
          { label: 'Swaps', value: current.swaps },
          { label: 'Order', value: `${mode.toUpperCase()} heap` },
        ]}
      />
    </div>
  );
}
