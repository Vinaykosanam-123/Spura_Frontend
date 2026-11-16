'use client';

import { useMemo, useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type FnKind = 'factorial' | 'fibonacci';

interface StackFrame {
  id: number;
  label: string;
  phase: 'active' | 'waiting' | 'returning';
  returnVal?: number;
}

interface RecFrame {
  stack: StackFrame[];
  calls: number;
  maxDepth: number;
  result: number | null;
  note: string;
  codeLine: number;
}

const CODE: Record<FnKind, string[]> = {
  factorial: [
    'fact(n):',
    '  if n <= 1: return 1',
    '  sub = fact(n - 1)',
    '  return n * sub',
  ],
  fibonacci: [
    'fib(n):',
    '  if n <= 1: return n',
    '  left = fib(n - 1)',
    '  right = fib(n - 2)',
    '  return left + right',
  ],
};

function buildFactorial(n: number): RecFrame[] {
  const frames: RecFrame[] = [];
  const stack: StackFrame[] = [];
  let calls = 0;
  let maxDepth = 0;
  let nextId = 1;

  function solve(k: number): number {
    const id = nextId++;
    calls++;
    stack.forEach((f) => (f.phase = 'waiting'));
    stack.push({ id, label: `fact(${k})`, phase: 'active' });
    maxDepth = Math.max(maxDepth, stack.length);

    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: null,
      note: `Push call frame fact(${k}) onto the call stack (depth ${stack.length}).`,
      codeLine: 0,
    });

    if (k <= 1) {
      stack[stack.length - 1].phase = 'returning';
      stack[stack.length - 1].returnVal = 1;
      frames.push({
        stack: stack.map((f) => ({ ...f })),
        calls,
        maxDepth,
        result: null,
        note: `Base case reached: k = ${k} <= 1. Return 1.`,
        codeLine: 1,
      });
      stack.pop();
      return 1;
    }

    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: null,
      note: `fact(${k}) pauses while waiting for fact(${k - 1}).`,
      codeLine: 2,
    });
    const sub = solve(k - 1);
    const val = k * sub;
    stack[stack.length - 1].phase = 'returning';
    stack[stack.length - 1].returnVal = val;
    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: stack.length === 1 ? val : null,
      note: `Unwind: fact(${k}) receives ${sub}, returns ${k} * ${sub} = ${val}.`,
      codeLine: 3,
    });
    stack.pop();
    return val;
  }

  const finalVal = solve(n);
  frames.push({
    stack: [],
    calls,
    maxDepth,
    result: finalVal,
    note: `All frames popped. factorial(${n}) = ${finalVal}.`,
    codeLine: 3,
  });
  return frames;
}

function buildFibonacci(n: number): RecFrame[] {
  const frames: RecFrame[] = [];
  const stack: StackFrame[] = [];
  let calls = 0;
  let maxDepth = 0;
  let nextId = 1;

  function solve(k: number): number {
    const id = nextId++;
    calls++;
    stack.forEach((f) => (f.phase = 'waiting'));
    stack.push({ id, label: `fib(${k})`, phase: 'active' });
    maxDepth = Math.max(maxDepth, stack.length);

    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: null,
      note: `Push fib(${k}) frame (total calls: ${calls}).`,
      codeLine: 0,
    });

    if (k <= 1) {
      stack[stack.length - 1].phase = 'returning';
      stack[stack.length - 1].returnVal = k;
      frames.push({
        stack: stack.map((f) => ({ ...f })),
        calls,
        maxDepth,
        result: null,
        note: `Base case fib(${k}) -> returns ${k}.`,
        codeLine: 1,
      });
      stack.pop();
      return k;
    }

    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: null,
      note: `fib(${k}) invokes left branch fib(${k - 1}).`,
      codeLine: 2,
    });
    const left = solve(k - 1);

    stack[stack.length - 1].phase = 'active';
    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: null,
      note: `fib(${k}) resumes with left = ${left}, now calls right branch fib(${k - 2}).`,
      codeLine: 3,
    });
    const right = solve(k - 2);

    const sum = left + right;
    stack[stack.length - 1].phase = 'returning';
    stack[stack.length - 1].returnVal = sum;
    frames.push({
      stack: stack.map((f) => ({ ...f })),
      calls,
      maxDepth,
      result: stack.length === 1 ? sum : null,
      note: `Pop fib(${k}): ${left} + ${right} = ${sum}.`,
      codeLine: 4,
    });
    stack.pop();
    return sum;
  }

  const finalVal = solve(n);
  frames.push({
    stack: [],
    calls,
    maxDepth,
    result: finalVal,
    note: `Call stack empty! fib(${n}) = ${finalVal} after ${calls} total recursive calls.`,
    codeLine: 4,
  });
  return frames;
}

export default function RecursionVisualizer() {
  const [fn, setFn] = useState<FnKind>('factorial');
  const [nVal, setNVal] = useState(4);

  const maxN = fn === 'factorial' ? 6 : 5;
  const clampedN = Math.min(maxN, Math.max(1, nVal));

  const frames = useMemo(
    () => (fn === 'factorial' ? buildFactorial(clampedN) : buildFibonacci(clampedN)),
    [fn, clampedN]
  );

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];

  const selectFn = (nextFn: FnKind) => {
    setFn(nextFn);
    if (nextFn === 'fibonacci' && nVal > 5) setNVal(4);
    player.restartAndPlay();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-white/10 bg-[#0F1319] p-0.5">
          {(['factorial', 'fibonacci'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => selectFn(k)}
              className={`h-8 rounded-full px-4 text-[13px] capitalize transition-colors ${
                fn === k ? 'bg-amber-500 font-semibold text-stone-950' : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              {k}(n)
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[13px] text-slate-300">
          n =
          <select
            value={clampedN}
            onChange={(e) => {
              setNVal(Number(e.target.value));
              player.restartAndPlay();
            }}
            className="h-9 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-[13px] text-slate-100 focus:border-amber-500 focus:outline-none"
          >
            {Array.from({ length: maxN }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <VisualizerBoard
        stage={
          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Live Call Stack (top frame at top)</span>
              {current.result !== null && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-emerald-300">
                  Final: {current.result}
                </span>
              )}
            </div>

            <div className="flex min-h-[250px] flex-col-reverse justify-start gap-2 rounded-2xl border border-white/10 bg-[#0F1319] p-4">
              {current.stack.length === 0 ? (
                <div className="m-auto text-center text-[13px] text-slate-500">
                  Stack empty — {current.result !== null ? `returned ${current.result}` : 'ready'}
                </div>
              ) : (
                current.stack.map((frameItem, idx) => {
                  const style =
                    frameItem.phase === 'returning'
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                      : frameItem.phase === 'active'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-white/10 bg-[#161B24] text-slate-300';
                  return (
                    <div
                      key={frameItem.id}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 py-2.5 font-mono text-[13px] transition-all ${style}`}
                    >
                      <span className="font-semibold">
                        <span className="mr-2 text-[11px] opacity-60">#{idx + 1}</span>
                        {frameItem.label}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider">
                        {frameItem.phase === 'returning'
                          ? `return ${frameItem.returnVal}`
                          : frameItem.phase === 'active'
                            ? 'executing'
                            : 'paused'}
                      </span>
                    </div>
                  );
                })
              )}
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
        code={CODE[fn]}
        codeLine={current.codeLine}
        stats={[
          { label: 'Active frames', value: current.stack.length },
          { label: 'Total calls', value: current.calls },
          { label: 'Max depth', value: current.maxDepth },
          { label: 'Return value', value: current.result ?? 'running...' },
        ]}
      />
    </div>
  );
}
