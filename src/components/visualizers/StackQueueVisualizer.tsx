'use client';

import { useState } from 'react';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';

interface Action {
  structure: 'stack' | 'queue';
  op: 'push' | 'pop' | 'enqueue' | 'dequeue' | 'reset';
  value: number | null;
  ok: boolean;
}

const CODE = [
  'Stack (LIFO):',
  '  push(x): a[top] = x; top++',
  '  pop(): x = a[top-1]; top--',
  '',
  'Queue (FIFO):',
  '  enqueue(x): a[tail] = x; tail++',
  '  dequeue(): x = a[head]; head++',
];

const START_STACK = [14, 27, 8];
const START_QUEUE = [21, 34, 55, 13];

export default function StackQueueVisualizer() {
  const [stack, setStack] = useState<number[]>(START_STACK);
  const [queue, setQueue] = useState<number[]>(START_QUEUE);
  const [input, setInput] = useState('42');
  const [error, setError] = useState('');
  const [action, setAction] = useState<Action>({
    structure: 'stack',
    op: 'push',
    value: null,
    ok: true,
  });
  const [log, setLog] = useState<string[]>([
    'Ready. Push or pop on the stack, enqueue or dequeue on the queue.',
  ]);

  const readValue = (): number | null => {
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      setError('Enter a whole number between 1 and 99.');
      return null;
    }
    setError('');
    return n;
  };

  const record = (entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, 5));
  };

  const push = () => {
    const value = readValue();
    if (value === null) return;
    if (stack.length >= 8) {
      setError('This demo holds up to 8 stack items. Pop one first.');
      return;
    }
    setStack((prev) => [...prev, value]);
    setAction({ structure: 'stack', op: 'push', value, ok: true });
    record(`push(${value}) — placed on top of the stack.`);
  };

  const pop = () => {
    if (stack.length === 0) {
      setAction({ structure: 'stack', op: 'pop', value: null, ok: false });
      record('pop() — underflow: the stack is empty.');
      return;
    }
    const value = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    setAction({ structure: 'stack', op: 'pop', value, ok: true });
    record(`pop() — removed ${value} from the top.`);
  };

  const enqueue = () => {
    const value = readValue();
    if (value === null) return;
    if (queue.length >= 8) {
      setError('This demo holds up to 8 queue items. Dequeue one first.');
      return;
    }
    setQueue((prev) => [...prev, value]);
    setAction({ structure: 'queue', op: 'enqueue', value, ok: true });
    record(`enqueue(${value}) — joined the back of the queue.`);
  };

  const dequeue = () => {
    if (queue.length === 0) {
      setAction({ structure: 'queue', op: 'dequeue', value: null, ok: false });
      record('dequeue() — underflow: the queue is empty.');
      return;
    }
    const value = queue[0];
    setQueue((prev) => prev.slice(1));
    setAction({ structure: 'queue', op: 'dequeue', value, ok: true });
    record(`dequeue() — removed ${value} from the front.`);
  };

  const reset = () => {
    setStack(START_STACK);
    setQueue(START_QUEUE);
    setError('');
    setAction({ structure: 'stack', op: 'reset', value: null, ok: true });
    setLog(['Reset to the starting stack and queue.']);
  };

  const note = (() => {
    if (action.structure === 'stack') {
      if (action.op === 'push') return action.value === null ? 'Push adds a value to the top of the stack.' : `${action.value} is now the top. The next pop will remove it first — last in, first out.`;
      if (action.op === 'pop') return action.ok ? `${action.value} left the stack. Only the most recently pushed item can be removed.` : 'The stack is empty, so pop has nothing to remove. This is stack underflow.';
      if (action.op === 'reset') return 'Both structures are back to their starting values.';
    }
    if (action.op === 'enqueue') return action.value === null ? 'Enqueue adds a value to the back of the queue.' : `${action.value} joined the back. It will wait until every item ahead of it is dequeued — first in, first out.`;
    if (action.op === 'dequeue') return action.ok ? `${action.value} left from the front. It was the oldest item in the queue.` : 'The queue is empty, so dequeue has nothing to remove. This is queue underflow.';
    return 'Push and pop at the top of the stack; enqueue at the back and dequeue from the front of the queue.';
  })();

  const codeLine =
    action.structure === 'stack'
      ? action.op === 'push'
        ? 1
        : action.op === 'pop'
          ? 2
          : 0
      : action.op === 'enqueue'
        ? 5
        : action.op === 'dequeue'
          ? 6
          : 0;

  const stats = [
    { label: 'Stack size', value: stack.length },
    { label: 'Queue size', value: queue.length },
    { label: 'Stack rule', value: 'LIFO' },
    { label: 'Queue rule', value: 'FIFO' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <label>
          <span className="sr-only">Value</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            inputMode="numeric"
            className="h-10 w-24 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
            aria-label="Value to push or enqueue"
          />
        </label>
        <button type="button" onClick={push} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Push → stack
        </button>
        <button type="button" onClick={pop} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Pop ← stack
        </button>
        <button type="button" onClick={enqueue} className="h-10 rounded-xl border border-teal-500/30 bg-teal-500/15 px-4 text-[13px] font-semibold text-teal-200 hover:bg-teal-500/25">
          Enqueue queue
        </button>
        <button type="button" onClick={dequeue} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Dequeue queue
        </button>
        <button type="button" onClick={reset} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0F1319] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Stack
                </p>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  LIFO
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">top of stack ↓</p>
              <div className="mt-2 flex min-h-[220px] flex-col items-stretch justify-end gap-1.5">
                {stack.length === 0 ? (
                  <p className="pb-4 text-center text-[13px] text-slate-500">empty stack</p>
                ) : (
                  [...stack].reverse().map((v, reversedIndex) => {
                    const index = stack.length - 1 - reversedIndex;
                    const isTop = index === stack.length - 1;
                    const justChanged =
                      action.value !== null &&
                      ((action.structure === 'stack' && action.op === 'push' && isTop) ||
                        (action.structure === 'stack' && action.op === 'pop' && stack.length === index + 1));
                    return (
                      <div key={`${index}-${v}`}>
                        <div
                          className={`rounded-xl border-2 px-3 py-2.5 text-center text-[15px] font-semibold tabular-nums transition-colors ${
                            justChanged
                              ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                              : 'border-white/10 bg-[#161B24] text-slate-100'
                          }`}
                        >
                          {v}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0F1319] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Queue
                </p>
                <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
                  FIFO
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">front → back</p>
              <div className="mt-2 flex min-h-[220px] flex-col justify-center">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                  {queue.length === 0 ? (
                    <span className="rounded-xl border border-dashed border-white/15 px-3 py-2 text-[13px] text-slate-500">
                      empty queue
                    </span>
                  ) : (
                    queue.map((v, i) => {
                      const justChanged =
                        (action.structure === 'queue' && action.op === 'enqueue' && i === queue.length - 1) ||
                        (action.structure === 'queue' && action.op === 'dequeue' && i === 0);
                      return (
                        <div key={`${i}-${v}`} className="flex shrink-0 items-center gap-1.5">
                          <div
                            className={`rounded-xl border-2 px-2.5 py-2 text-center text-[14px] font-semibold tabular-nums transition-colors ${
                              justChanged
                                ? 'border-teal-400 bg-teal-500/15 text-teal-200'
                                : 'border-white/10 bg-[#161B24] text-slate-100'
                            }`}
                          >
                            {v}
                          </div>
                          {i < queue.length - 1 && <span className="text-[13px] text-slate-500" aria-hidden>→</span>}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-slate-400">
                  A queue removes from the front. A real implementation uses a linked list or circular buffer so both ends stay O(1).
                </p>
              </div>
            </div>
          </div>
        }
        controls={
          <div className="border-t border-white/10 bg-[#0F1319] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-400">Operation log</p>
            <ul className="mt-1.5 space-y-0.5">
              {log.map((entry, i) => (
                <li key={`${entry}-${i}`} className={`text-[12px] ${i === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        }
        note={note}
        code={CODE}
        codeLine={codeLine}
        stats={stats}
      />
    </div>
  );
}
