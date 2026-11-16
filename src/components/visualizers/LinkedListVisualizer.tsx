'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Op = 'insert-head' | 'insert-tail' | 'delete' | 'search';

interface LLFrame {
  values: number[];
  active: number[];
  compare: number[];
  visited: number[];
  inserted: number[];
  removed: number[];
  note: string;
  codeLine: number;
  comparisons: number;
}

const CODE: Record<Op, string[]> = {
  'insert-head': ['newNode = Node(value)', 'newNode.next = head', 'head = newNode', 'size = size + 1'],
  'insert-tail': ['node = head', 'while node.next != null:', '  node = node.next', 'node.next = Node(value)', 'size = size + 1'],
  delete: [
    'prev = null',
    'node = head',
    'while node != null and node.value != value:',
    '  prev = node; node = node.next',
    'if node == null: return',
    'if prev == null: head = node.next',
    'else: prev.next = node.next',
  ],
  search: ['node = head', 'while node != null:', '  if node.value == value: return node', '  node = node.next', 'return null'],
};

const OP_LABEL: Record<Op, string> = {
  'insert-head': 'Insert at head',
  'insert-tail': 'Insert at tail',
  delete: 'Delete value',
  search: 'Search',
};

const START = [12, 7, 25, 3, 18];

function snap(
  values: number[],
  note: string,
  codeLine: number,
  opts: Partial<Pick<LLFrame, 'active' | 'compare' | 'visited' | 'inserted' | 'removed' | 'comparisons'>> = {}
): LLFrame {
  return {
    values: [...values],
    active: [...(opts.active ?? [])],
    compare: [...(opts.compare ?? [])],
    visited: [...(opts.visited ?? [])],
    inserted: [...(opts.inserted ?? [])],
    removed: [...(opts.removed ?? [])],
    note,
    codeLine,
    comparisons: opts.comparisons ?? 0,
  };
}

function insertHead(values: number[], value: number): LLFrame[] {
  const frames: LLFrame[] = [];
  frames.push(snap(values, `Create a new node holding ${value}. It will become the new head.`, 0));
  frames.push(snap([value, ...values], `Point the new node's next pointer at the old head (${values[0] ?? 'null'}). Head insertion is O(1).`, 1, { active: [0], inserted: [0] }));
  return frames;
}

function insertTail(values: number[], value: number): LLFrame[] {
  const frames: LLFrame[] = [];
  let comparisons = 0;
  frames.push(snap(values, 'Start at the head and walk to the last node. There is no index to jump to.', 0, { active: [0] }));
  for (let i = 0; i < values.length - 1; i++) {
    comparisons++;
    frames.push(snap(values, `Node ${values[i]} has a next pointer, so it is not the tail. Move to ${values[i + 1]}.`, 2, { active: [i], compare: [i + 1], comparisons }));
  }
  if (values.length > 0) comparisons++;
  frames.push(snap([...values, value], `The last node's next pointer becomes a new node holding ${value}. Appending is O(n) because you must find the tail first.`, 3, { active: [values.length], inserted: [values.length], comparisons }));
  return frames;
}

function deleteValue(values: number[], value: number): LLFrame[] {
  const frames: LLFrame[] = [];
  let comparisons = 0;
  let prev = -1;
  frames.push(snap(values, `Search for ${value}. Keep a prev pointer so the chain can be rewired.`, 0));
  let found = -1;
  for (let i = 0; i < values.length; i++) {
    comparisons++;
    frames.push(snap(values, `Compare node ${values[i]} with ${value}.`, 2, { active: i === 0 ? [] : [prev], compare: [i], visited: Array.from({ length: i }, (_, k) => k), comparisons }));
    if (values[i] === value) {
      found = i;
      break;
    }
    prev = i;
    frames.push(snap(values, `${values[i]} is not the target. Move prev to node ${values[i]} and advance.`, 3, { active: [i], visited: Array.from({ length: i + 1 }, (_, k) => k), comparisons }));
  }
  if (found === -1) {
    frames.push(snap(values, `${value} is not in the list. Traverse reached null; nothing changes.`, 4, { visited: values.map((_, i) => i), comparisons }));
    return frames;
  }
  if (prev === -1) {
    frames.push(snap(values.slice(1), `Found ${value} at the head. Move head to the next node. Deleting the head is O(1).`, 5, { removed: [0], comparisons }));
  } else {
    frames.push(snap(values.filter((_, i) => i !== found), `Found ${value}. Point prev (${values[prev]}) past it to ${values[found + 1] ?? 'null'}.`, 6, { removed: [found], comparisons }));
  }
  return frames;
}

function searchValue(values: number[], value: number): LLFrame[] {
  const frames: LLFrame[] = [];
  let comparisons = 0;
  frames.push(snap(values, `Start at the head and compare each node with ${value}.`, 0, { active: [0] }));
  for (let i = 0; i < values.length; i++) {
    comparisons++;
    if (values[i] === value) {
      frames.push(snap(values, `Found ${value} at node ${i}. Search is O(n) in the worst case.`, 2, { active: [i], inserted: [i], visited: Array.from({ length: i }, (_, k) => k), comparisons }));
      return frames;
    }
    frames.push(snap(values, `Node ${values[i]} is not ${value}. Follow its next pointer.`, 3, { active: [i], visited: Array.from({ length: i + 1 }, (_, k) => k), comparisons }));
  }
  frames.push(snap(values, `${value} is not in the list. We reached null after ${comparisons} comparisons.`, 4, { visited: values.map((_, i) => i), comparisons }));
  return frames;
}

export default function LinkedListVisualizer() {
  const [values, setValues] = useState(START);
  const [input, setInput] = useState('9');
  const [op, setOp] = useState<Op>('search');
  const [frames, setFrames] = useState<LLFrame[]>([
    snap(START, 'A linked list stores values in nodes. Each node holds one value and a pointer to the next node.', 0),
  ]);
  const [error, setError] = useState('');
  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];

  const readValue = (): number | null => {
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      setError('Enter a whole number between 1 and 99.');
      return null;
    }
    setError('');
    return n;
  };

  const run = (nextOp: Op) => {
    const value = readValue();
    if (value === null) return;
    let nextFrames: LLFrame[] = [];
    let nextValues = values;
    if (nextOp === 'insert-head') {
      nextFrames = insertHead(values, value);
      nextValues = [value, ...values];
    } else if (nextOp === 'insert-tail') {
      nextFrames = insertTail(values, value);
      nextValues = [...values, value];
    } else if (nextOp === 'delete') {
      nextFrames = deleteValue(values, value);
      const index = values.indexOf(value);
      nextValues = index === -1 ? values : values.filter((_, i) => i !== index);
    } else {
      nextFrames = searchValue(values, value);
    }
    setOp(nextOp);
    setValues(nextValues);
    setFrames(nextFrames);
    player.restartAndPlay();
  };

  const resetList = () => {
    setValues(START);
    setFrames([snap(START, 'Reset to the starting list. Try inserting, deleting, or searching for a value.', 0)]);
    setOp('search');
    setError('');
    player.reset();
  };

  const stats = [
    { label: 'Nodes', value: current.values.length },
    { label: 'Comparisons', value: current.comparisons },
    { label: 'Operation', value: OP_LABEL[op] },
    { label: 'Access', value: 'O(n)' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <label>
          <span className="sr-only">Value</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') run('search');
            }}
            inputMode="numeric"
            className="h-10 w-20 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
            aria-label="Value to insert, delete or search"
          />
        </label>
        <button type="button" onClick={() => run('insert-head')} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert head
        </button>
        <button type="button" onClick={() => run('insert-tail')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Insert tail
        </button>
        <button type="button" onClick={() => run('search')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Search
        </button>
        <button type="button" onClick={() => run('delete')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Delete
        </button>
        <button type="button" onClick={resetList} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset list
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-3xl overflow-x-auto py-6">
            <div className="flex min-w-max items-center justify-center gap-1 px-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">head</span>
              {current.values.length === 0 ? (
                <span className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-[13px] text-slate-400">
                  null — empty list
                </span>
              ) : (
                current.values.map((v, i) => {
                  const isRemoved = current.removed.includes(i);
                  const isInserted = current.inserted.includes(i);
                  const isCompare = current.compare.includes(i);
                  const isActive = current.active.includes(i);
                  const isVisited = current.visited.includes(i);
                  const color = isRemoved
                    ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 line-through opacity-60'
                    : isCompare
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : isInserted
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : isActive
                          ? 'border-orange-400 bg-orange-500/15 text-orange-200'
                          : isVisited
                            ? 'border-slate-500 bg-[#1C222D] text-slate-200'
                            : 'border-white/15 bg-[#161B24] text-slate-100';
                  return (
                    <div key={`${i}-${v}`} className="flex items-center">
                      <div className={`overflow-hidden rounded-xl border-2 transition-colors ${color}`}>
                        <div className="px-4 py-2 text-center text-[14px] font-semibold tabular-nums">{v}</div>
                        <div className="border-t border-white/10 px-3 py-0.5 text-center text-[9px] uppercase tracking-wide text-slate-400">next</div>
                      </div>
                      <span className="mx-1.5 text-[16px] text-amber-400/70" aria-hidden>
                        →
                      </span>
                    </div>
                  );
                })
              )}
              <span className="rounded-lg border border-dashed border-white/15 px-2.5 py-1.5 text-[11px] text-slate-400">
                null
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
        code={CODE[op]}
        codeLine={current.codeLine}
        stats={stats}
      />
    </div>
  );
}
