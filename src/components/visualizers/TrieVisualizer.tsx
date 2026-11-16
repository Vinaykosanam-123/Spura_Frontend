'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Op = 'insert' | 'search' | 'startsWith';

interface TrieFrame {
  words: string[];
  activePrefix: string;
  matched: boolean | null;
  note: string;
  codeLine: number;
}

const CODE: Record<Op, string[]> = {
  insert: [
    'node = root',
    'for char in word:',
    '  if !node.children[char]:',
    '    node.children[char] = TrieNode()',
    '  node = node.children[char]',
    'node.isEndOfWord = true',
  ],
  search: [
    'node = root',
    'for char in word:',
    '  if !node.children[char]: return false',
    '  node = node.children[char]',
    'return node.isEndOfWord',
  ],
  startsWith: [
    'node = root',
    'for char in prefix:',
    '  if !node.children[char]: return false',
    '  node = node.children[char]',
    'return true',
  ],
};

const START_WORDS = ['cat', 'car', 'card', 'dog'];

interface LayoutTrieNode {
  prefix: string;
  char: string;
  isWord: boolean;
  x: number;
  y: number;
  parentPrefix: string | null;
}

function buildTrieLayout(words: string[]): { nodes: LayoutTrieNode[]; height: number } {
  interface RawNode {
    prefix: string;
    char: string;
    isWord: boolean;
    children: Map<string, RawNode>;
  }
  const root: RawNode = { prefix: '', char: 'root', isWord: false, children: new Map() };
  for (const w of words) {
    let cur = root;
    let p = '';
    for (const ch of w) {
      p += ch;
      if (!cur.children.has(ch)) {
        cur.children.set(ch, { prefix: p, char: ch, isWord: false, children: new Map() });
      }
      cur = cur.children.get(ch)!;
    }
    cur.isWord = true;
  }

  // Assign leaf x slots using inorder leaf counter
  let leafIndex = 0;
  function countLeaves(n: RawNode): number {
    if (n.children.size === 0) return 1;
    let total = 0;
    for (const child of n.children.values()) total += countLeaves(child);
    return total;
  }
  const totalLeaves = Math.max(1, countLeaves(root));

  const out: LayoutTrieNode[] = [];
  let maxDepth = 0;
  function assign(n: RawNode, depth: number, parentPrefix: string | null): number {
    maxDepth = Math.max(maxDepth, depth);
    let xPos = 0;
    if (n.children.size === 0) {
      xPos = totalLeaves === 1 ? 350 : 60 + (leafIndex * 580) / (totalLeaves - 1);
      leafIndex++;
    } else {
      const childXs: number[] = [];
      for (const child of Array.from(n.children.values()).sort((a, b) => a.char.localeCompare(b.char))) {
        childXs.push(assign(child, depth + 1, n.prefix));
      }
      xPos = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    }
    out.push({
      prefix: n.prefix,
      char: n.char,
      isWord: n.isWord,
      x: xPos,
      y: 38 + depth * 64,
      parentPrefix,
    });
    return xPos;
  }
  assign(root, 0, null);
  return { nodes: out, height: Math.max(220, 48 + maxDepth * 64 + 50) };
}

function buildSteps(words: string[], rawQuery: string, op: Op): { frames: TrieFrame[]; nextWords: string[] } {
  const q = rawQuery.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!q) {
    return {
      frames: [{ words, activePrefix: '', matched: null, note: 'Enter letters a–z.', codeLine: 0 }],
      nextWords: words,
    };
  }
  const frames: TrieFrame[] = [{ words, activePrefix: '', matched: null, note: `Start at root for "${q}".`, codeLine: 0 }];

  if (op === 'insert') {
    let accWords = [...words];
    let prefix = '';
    for (const ch of q) {
      const existed = accWords.some((w) => w.startsWith(prefix + ch));
      prefix += ch;
      if (!existed) {
        accWords = Array.from(new Set([...accWords, prefix]));
      }
      frames.push({
        words: accWords,
        activePrefix: prefix,
        matched: null,
        note: existed
          ? `Character '${ch}' already exists under "${prefix.slice(0, -1) || 'root'}". Reuse node!`
          : `Create new edge '${ch}' -> prefix "${prefix}".`,
        codeLine: existed ? 4 : 3,
      });
    }
    const finalWords = Array.from(new Set([...words, q]));
    frames.push({
      words: finalWords,
      activePrefix: q,
      matched: true,
      note: `Mark "${q}" as terminal end-of-word.`,
      codeLine: 5,
    });
    return { frames, nextWords: finalWords };
  }

  let prefix = '';
  for (const ch of q) {
    const next = prefix + ch;
    const hasPath = words.some((w) => w.startsWith(next));
    if (!hasPath) {
      frames.push({
        words,
        activePrefix: prefix,
        matched: false,
        note: `No edge '${ch}' from "${prefix || 'root'}". Stop early and return false.`,
        codeLine: 2,
      });
      return { frames, nextWords: words };
    }
    prefix = next;
    frames.push({
      words,
      activePrefix: prefix,
      matched: null,
      note: `Follow edge '${ch}' to node "${prefix}".`,
      codeLine: 3,
    });
  }

  const foundExact = words.includes(q);
  const ok = op === 'startsWith' ? true : foundExact;
  frames.push({
    words,
    activePrefix: q,
    matched: ok,
    note:
      op === 'startsWith'
        ? `Prefix "${q}" exists in the Trie! Return true.`
        : foundExact
          ? `"${q}" is marked end-of-word. Search returns true.`
          : `Path "${q}" exists only as a prefix, not a complete inserted word. Returns false.`,
    codeLine: 4,
  });
  return { frames, nextWords: words };
}

export default function TrieVisualizer() {
  const [words, setWords] = useState<string[]>(START_WORDS);
  const [input, setInput] = useState('cart');
  const [op, setOp] = useState<Op>('insert');
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<TrieFrame[]>([
    {
      words: START_WORDS,
      activePrefix: '',
      matched: null,
      note: 'Green double-rings mark complete stored words. Insert "cart" or search for "car" vs "ca".',
      codeLine: 0,
    },
  ]);

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];
  const layout = buildTrieLayout(current.words);
  const byPrefix = new Map(layout.nodes.map((n) => [n.prefix, n]));

  const runOp = (nextOp: Op) => {
    const clean = input.trim().toLowerCase();
    if (!/^[a-z]{1,8}$/.test(clean)) {
      setError('Enter 1–8 lowercase letters (a–z).');
      return;
    }
    if (nextOp === 'insert' && words.length >= 10 && !words.includes(clean)) {
      setError('Demo supports up to 10 words cleanly. Reset to clear.');
      return;
    }
    setError('');
    setOp(nextOp);
    const res = buildSteps(words, clean, nextOp);
    setWords(res.nextWords);
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const reset = () => {
    setWords(START_WORDS);
    setInput('cart');
    setError('');
    setOp('insert');
    setFrames([
      {
        words: START_WORDS,
        activePrefix: '',
        matched: null,
        note: 'Reset dictionary to [cat, car, card, dog].',
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
          onKeyDown={(e) => e.key === 'Enter' && runOp('search')}
          placeholder="word..."
          className="h-10 w-32 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-[14px] font-mono text-slate-100 focus:border-amber-500 focus:outline-none"
          aria-label="Word or prefix"
        />
        <button type="button" onClick={() => runOp('insert')} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert word
        </button>
        <button type="button" onClick={() => runOp('search')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Search
        </button>
        <button type="button" onClick={() => runOp('startsWith')} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          StartsWith
        </button>
        <button type="button" onClick={reset} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            <svg viewBox={`0 0 700 ${layout.height}`} className="mx-auto h-auto w-full max-w-[680px]" role="img" aria-label="Prefix Trie">
              {layout.nodes.map((node) => {
                if (node.parentPrefix === null) return null;
                const parent = byPrefix.get(node.parentPrefix);
                if (!parent) return null;
                const onPath = current.activePrefix.startsWith(node.prefix);
                return (
                  <line
                    key={`e-${node.prefix}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={node.x}
                    y2={node.y}
                    className={onPath ? 'stroke-amber-400' : 'stroke-slate-700'}
                    strokeWidth={onPath ? 3 : 2}
                  />
                );
              })}
              {layout.nodes.map((node) => {
                const isExactCurrent = node.prefix === current.activePrefix && current.activePrefix !== '';
                const onPath = node.prefix !== '' && current.activePrefix.startsWith(node.prefix);
                const circleCls =
                  isExactCurrent && current.matched === false
                    ? 'fill-rose-500 stroke-rose-400'
                    : isExactCurrent && current.matched === true
                      ? 'fill-emerald-500 stroke-emerald-400'
                      : isExactCurrent
                        ? 'fill-amber-400 stroke-amber-300'
                        : onPath
                          ? 'fill-amber-500/20 stroke-amber-400'
                          : node.isWord
                            ? 'fill-[#161B24] stroke-emerald-400'
                            : 'fill-[#161B24] stroke-slate-600';
                const textCls = isExactCurrent ? 'fill-stone-950 font-bold' : 'fill-slate-100 font-semibold';
                return (
                  <g key={`n-${node.prefix || 'root'}`}>
                    <circle cx={node.x} cy={node.y} r={node.prefix === '' ? 20 : 17} strokeWidth={2} className={circleCls} />
                    {node.isWord && (
                      <circle cx={node.x} cy={node.y} r={21} fill="none" strokeWidth={1.5} className="stroke-emerald-400/70" strokeDasharray="3 2" />
                    )}
                    <text x={node.x} y={node.y + 4} textAnchor="middle" className={`text-[12px] ${textCls}`}>
                      {node.prefix === '' ? '*' : node.char}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
              <span className="mr-1 font-semibold uppercase tracking-wide text-amber-400">Stored words:</span>
              {current.words.map((w) => (
                <span key={w} className="rounded-md border border-white/10 bg-[#161B24] px-2 py-0.5 font-mono text-slate-200">
                  {w}
                </span>
              ))}
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
          { label: 'Words', value: current.words.length },
          { label: 'Trie nodes', value: layout.nodes.length },
          { label: 'Active prefix', value: current.activePrefix || 'root' },
          { label: 'Max lookup', value: 'O(L)' },
        ]}
      />
    </div>
  );
}
