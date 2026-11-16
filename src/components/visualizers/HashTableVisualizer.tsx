'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Op = 'insert' | 'search' | 'delete';

interface HashFrame {
  buckets: number[][];
  activeBucket: number | null;
  activeNode: number | null;
  matched: number | null;
  note: string;
  codeLine: number;
}

const BUCKET_COUNT = 7;

const CODE: Record<Op, string[]> = {
  insert: [
    'idx = key % 7',
    'chain = buckets[idx]',
    'for node in chain:',
    '  if node == key: return  // duplicate',
    'chain.append(key)',
  ],
  search: [
    'idx = key % 7',
    'for node in buckets[idx]:',
    '  if node == key: return true',
    'return false',
  ],
  delete: [
    'idx = key % 7',
    'for i, node in enumerate(buckets[idx]):',
    '  if node == key: buckets[idx].removeAt(i); return',
    'return  // not found',
  ],
};

function makeInitialBuckets(): number[][] {
  const b: number[][] = Array.from({ length: BUCKET_COUNT }, () => []);
  for (const key of [15, 22, 9, 16, 30, 4, 25]) {
    b[key % BUCKET_COUNT].push(key);
  }
  return b;
}

const cloneBuckets = (b: number[][]) => b.map((chain) => [...chain]);

function runOpFrames(buckets: number[][], key: number, op: Op): { frames: HashFrame[]; next: number[][] } {
  const b = cloneBuckets(buckets);
  const idx = key % BUCKET_COUNT;
  const frames: HashFrame[] = [
    {
      buckets: cloneBuckets(b),
      activeBucket: idx,
      activeNode: null,
      matched: null,
      note: `Hash key ${key}: ${key} mod ${BUCKET_COUNT} = bucket ${idx}.`,
      codeLine: 0,
    },
  ];

  const chain = b[idx];
  for (let i = 0; i < chain.length; i++) {
    frames.push({
      buckets: cloneBuckets(b),
      activeBucket: idx,
      activeNode: chain[i],
      matched: null,
      note: `Walk chain[${i}]: compare ${chain[i]} with ${key}.`,
      codeLine: op === 'insert' ? 2 : 1,
    });
    if (chain[i] === key) {
      if (op === 'insert') {
        frames.push({
          buckets: cloneBuckets(b),
          activeBucket: idx,
          activeNode: key,
          matched: key,
          note: `${key} is already present in bucket ${idx}. Skip duplicate insert.`,
          codeLine: 3,
        });
        return { frames, next: b };
      }
      if (op === 'search') {
        frames.push({
          buckets: cloneBuckets(b),
          activeBucket: idx,
          activeNode: null,
          matched: key,
          note: `Found ${key} in bucket ${idx} after checking ${i + 1} chain node(s).`,
          codeLine: 2,
        });
        return { frames, next: b };
      }
      if (op === 'delete') {
        chain.splice(i, 1);
        frames.push({
          buckets: cloneBuckets(b),
          activeBucket: idx,
          activeNode: null,
          matched: null,
          note: `Deleted ${key} from bucket ${idx}.`,
          codeLine: 2,
        });
        return { frames, next: b };
      }
    }
  }

  if (op === 'insert') {
    chain.push(key);
    frames.push({
      buckets: cloneBuckets(b),
      activeBucket: idx,
      activeNode: null,
      matched: key,
      note:
        chain.length > 1
          ? `Collision handled by chaining: appended ${key} to bucket ${idx} (chain length ${chain.length}).`
          : `Inserted ${key} into empty bucket ${idx}.`,
      codeLine: 4,
    });
  } else {
    frames.push({
      buckets: cloneBuckets(b),
      activeBucket: idx,
      activeNode: null,
      matched: null,
      note: `${key} not found in bucket ${idx}.`,
      codeLine: 3,
    });
  }
  return { frames, next: b };
}

export default function HashTableVisualizer() {
  const [buckets, setBuckets] = useState<number[][]>(() => makeInitialBuckets());
  const [input, setInput] = useState('37');
  const [op, setOp] = useState<Op>('insert');
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<HashFrame[]>([
    {
      buckets: makeInitialBuckets(),
      activeBucket: null,
      activeNode: null,
      matched: null,
      note: 'Hash function h(k) = k mod 7 maps keys to 7 buckets. Notice collisions (e.g. 15, 22, 9 -> buckets 1 & 2) form linked chains.',
      codeLine: 0,
    },
  ]);

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];
  const totalItems = current.buckets.reduce((s, c) => s + c.length, 0);

  const execute = (nextOp: Op) => {
    const val = Number(input);
    if (!Number.isInteger(val) || val < 0 || val > 999) {
      setError('Enter a whole number between 0 and 999.');
      return;
    }
    setError('');
    setOp(nextOp);
    const res = runOpFrames(buckets, val, nextOp);
    setBuckets(res.next);
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const reset = () => {
    const init = makeInitialBuckets();
    setBuckets(init);
    setInput('37');
    setError('');
    setOp('insert');
    setFrames([
      {
        buckets: init,
        activeBucket: null,
        activeNode: null,
        matched: null,
        note: 'Reset hash table.',
        codeLine: 0,
      },
    ]);
    player.reset();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && execute('search')}
          inputMode="numeric"
          className="h-10 w-24 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
          aria-label="Key value"
        />
        <button type="button" onClick={() => execute('insert')} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert
        </button>
        <button type="button" onClick={() => execute('search')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Search
        </button>
        <button type="button" onClick={() => execute('delete')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Delete
        </button>
        <button type="button" onClick={reset} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl space-y-2.5">
            {current.buckets.map((chain, idx) => {
              const isBucket = current.activeBucket === idx;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-xl border-2 font-mono text-[12px] font-bold transition-colors ${
                      isBucket
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-white/10 bg-[#161B24] text-slate-400'
                    }`}
                  >
                    [{idx}]
                  </div>
                  <span className="text-slate-600" aria-hidden>
                    →
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {chain.length === 0 ? (
                      <span className="rounded-lg border border-dashed border-white/10 px-2.5 py-1 text-[11px] text-slate-600">
                        null
                      </span>
                    ) : (
                      chain.map((k, nIdx) => {
                        const isMatch = current.matched === k && isBucket;
                        const isAct = current.activeNode === k && isBucket;
                        return (
                          <div key={`${idx}-${nIdx}-${k}`} className="flex items-center gap-1.5">
                            <span
                              className={`rounded-xl border-2 px-3 py-1.5 font-mono text-[13px] font-semibold tabular-nums transition-colors ${
                                isMatch
                                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                  : isAct
                                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                    : 'border-white/10 bg-[#161B24] text-slate-100'
                              }`}
                            >
                              {k}
                            </span>
                            {nIdx < chain.length - 1 && (
                              <span className="text-slate-600" aria-hidden>
                                →
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
          { label: 'Buckets', value: BUCKET_COUNT },
          { label: 'Keys stored', value: totalItems },
          { label: 'Load factor', value: (totalItems / BUCKET_COUNT).toFixed(2) },
          { label: 'Avg lookup', value: 'O(1 + α)' },
        ]}
      />
    </div>
  );
}
