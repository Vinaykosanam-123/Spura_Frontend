'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

interface AvlNode {
  val: number;
  h: number;
  left: AvlNode | null;
  right: AvlNode | null;
}

interface AvlFrame {
  tree: AvlNode | null;
  active: number | null;
  rotated: number[];
  unbalanced: number | null;
  note: string;
  codeLine: number;
  rotations: number;
}

const CODE = [
  'insert(node, key):',
  '  if !node: return Node(key)',
  '  bstInsert(node, key); updateHeight(node)',
  '  bf = height(node.left) - height(node.right)',
  '  if bf > 1 && key < left.val: return rightRotate(node)     // LL',
  '  if bf < -1 && key > right.val: return leftRotate(node)    // RR',
  '  if bf > 1: left = leftRotate(left); return rightRotate(node) // LR',
  '  if bf < -1: right = rightRotate(right); return leftRotate(node) // RL',
];

const h = (n: AvlNode | null) => (n ? n.h : 0);
const bf = (n: AvlNode | null) => (n ? h(n.left) - h(n.right) : 0);
const makeNode = (val: number, left: AvlNode | null = null, right: AvlNode | null = null): AvlNode => ({
  val,
  left,
  right,
  h: 1 + Math.max(h(left), h(right)),
});
const clone = (n: AvlNode | null): AvlNode | null => (n ? { val: n.val, h: n.h, left: clone(n.left), right: clone(n.right) } : null);

function rotateRight(y: AvlNode): AvlNode {
  const x = y.left!;
  const t2 = x.right;
  const ny = makeNode(y.val, t2, y.right);
  return makeNode(x.val, x.left, ny);
}

function rotateLeft(x: AvlNode): AvlNode {
  const y = x.right!;
  const t2 = y.left;
  const nx = makeNode(x.val, x.left, t2);
  return makeNode(y.val, nx, y.right);
}

function insertAvlAnimated(root: AvlNode | null, key: number): { frames: AvlFrame[]; nextTree: AvlNode | null; rotations: number } {
  const frames: AvlFrame[] = [];
  let rotations = 0;

  const insertRec = (node: AvlNode | null): AvlNode => {
    if (!node) {
      const created = makeNode(key);
      return created;
    }
    if (key < node.val) {
      return makeNode(node.val, insertRec(node.left), node.right);
    }
    if (key > node.val) {
      return makeNode(node.val, node.left, insertRec(node.right));
    }
    return node;
  };

  // First show raw BST insert before balancing if imbalance happens
  const rawTree = insertRec(root);
  let unbalancedNode: number | null = null;
  const findUnbalanced = (n: AvlNode | null) => {
    if (!n) return;
    findUnbalanced(n.left);
    findUnbalanced(n.right);
    if (Math.abs(bf(n)) > 1 && unbalancedNode === null) unbalancedNode = n.val;
  };
  findUnbalanced(rawTree);

  frames.push({
    tree: clone(rawTree),
    active: key,
    rotated: [],
    unbalanced: unbalancedNode,
    note:
      unbalancedNode !== null
        ? `Inserted ${key} using BST ordering. Node ${unbalancedNode} now has |balance factor| = 2 — imbalance detected!`
        : `Inserted ${key}. Every ancestor balance factor stays within [-1, +1].`,
    codeLine: unbalancedNode !== null ? 3 : 2,
    rotations: 0,
  });

  const rebalanceRec = (node: AvlNode | null): AvlNode | null => {
    if (!node) return null;
    const leftFixed = rebalanceRec(node.left);
    const rightFixed = rebalanceRec(node.right);
    const cur = makeNode(node.val, leftFixed, rightFixed);
    const balance = bf(cur);

    if (balance > 1 && bf(cur.left) >= 0) {
      rotations++;
      const rotatedTree = rotateRight(cur);
      frames.push({
        tree: clone(rotatedTree),
        active: rotatedTree.val,
        rotated: [rotatedTree.val, cur.val],
        unbalanced: null,
        note: `LL Imbalance at ${cur.val} (bf=${balance}): Right rotation lifts ${rotatedTree.val} as parent.`,
        codeLine: 4,
        rotations,
      });
      return rotatedTree;
    }
    if (balance < -1 && bf(cur.right) <= 0) {
      rotations++;
      const rotatedTree = rotateLeft(cur);
      frames.push({
        tree: clone(rotatedTree),
        active: rotatedTree.val,
        rotated: [rotatedTree.val, cur.val],
        unbalanced: null,
        note: `RR Imbalance at ${cur.val} (bf=${balance}): Left rotation lifts ${rotatedTree.val} as parent.`,
        codeLine: 5,
        rotations,
      });
      return rotatedTree;
    }
    if (balance > 1 && bf(cur.left) < 0) {
      rotations += 2;
      const step1 = makeNode(cur.val, rotateLeft(cur.left!), cur.right);
      frames.push({
        tree: clone(step1),
        active: step1.left?.val ?? null,
        rotated: [cur.val, step1.left?.val ?? cur.val],
        unbalanced: cur.val,
        note: `LR Imbalance at ${cur.val}: First left-rotate left child to turn it into an LL shape.`,
        codeLine: 6,
        rotations: rotations - 1,
      });
      const step2 = rotateRight(step1);
      frames.push({
        tree: clone(step2),
        active: step2.val,
        rotated: [step2.val, cur.val],
        unbalanced: null,
        note: `LR Step 2: Right-rotate ${cur.val} to restore AVL balance across the subtree.`,
        codeLine: 6,
        rotations,
      });
      return step2;
    }
    if (balance < -1 && bf(cur.right) > 0) {
      rotations += 2;
      const step1 = makeNode(cur.val, cur.left, rotateRight(cur.right!));
      frames.push({
        tree: clone(step1),
        active: step1.right?.val ?? null,
        rotated: [cur.val, step1.right?.val ?? cur.val],
        unbalanced: cur.val,
        note: `RL Imbalance at ${cur.val}: First right-rotate right child to turn it into an RR shape.`,
        codeLine: 7,
        rotations: rotations - 1,
      });
      const step2 = rotateLeft(step1);
      frames.push({
        tree: clone(step2),
        active: step2.val,
        rotated: [step2.val, cur.val],
        unbalanced: null,
        note: `RL Step 2: Left-rotate ${cur.val} to restore AVL balance across the subtree.`,
        codeLine: 7,
        rotations,
      });
      return step2;
    }
    return cur;
  };

  const finalTree = rebalanceRec(rawTree);
  if (rotations > 0) {
    frames.push({
      tree: clone(finalTree),
      active: null,
      rotated: [],
      unbalanced: null,
      note: `AVL invariant restored. Total rotations applied: ${rotations}.`,
      codeLine: 0,
      rotations,
    });
  }
  return { frames, nextTree: finalTree, rotations };
}

function buildFromSeq(seq: number[]): AvlNode | null {
  let root: AvlNode | null = null;
  for (const val of seq) {
    root = insertAvlAnimated(root, val).nextTree;
  }
  return root;
}

interface PosNode {
  val: number;
  bf: number;
  x: number;
  y: number;
  parent: number | null;
}

function layoutAvl(root: AvlNode | null): { nodes: PosNode[]; height: number } {
  if (!root) return { nodes: [], height: 220 };
  const list: { node: AvlNode; depth: number; parent: number | null }[] = [];
  const walk = (n: AvlNode | null, depth: number, parent: number | null) => {
    if (!n) return;
    walk(n.left, depth + 1, n.val);
    list.push({ node: n, depth, parent });
    walk(n.right, depth + 1, n.val);
  };
  walk(root, 0, null);
  const maxDepth = list.reduce((m, item) => Math.max(m, item.depth), 0);
  const yGap = Math.min(68, 250 / Math.max(1, maxDepth));
  const nodes: PosNode[] = list.map((item, i) => ({
    val: item.node.val,
    bf: bf(item.node),
    x: list.length === 1 ? 350 : 55 + (i * 590) / (list.length - 1),
    y: 42 + item.depth * yGap,
    parent: item.parent,
  }));
  return { nodes, height: Math.max(210, 42 + maxDepth * yGap + 65) };
}

const DEFAULT_KEYS = [30, 20, 40, 10, 25];

export default function AvlVisualizer() {
  const [tree, setTree] = useState<AvlNode | null>(() => buildFromSeq(DEFAULT_KEYS));
  const [input, setInput] = useState('5');
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<AvlFrame[]>([
    {
      tree: buildFromSeq(DEFAULT_KEYS),
      active: null,
      rotated: [],
      unbalanced: null,
      note: 'Each node displays its balance factor bf = height(L) - height(R). Insert 5 to trigger an LL rotation!',
      codeLine: 3,
      rotations: 0,
    },
  ]);

  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];
  const layout = layoutAvl(current.tree);
  const byVal = new Map(layout.nodes.map((n) => [n.val, n]));

  const runInsertValue = (val: number) => {
    if (!Number.isInteger(val) || val < 1 || val > 99) {
      setError('Enter a whole number between 1 and 99.');
      return;
    }
    if (layout.nodes.length >= 13) {
      setError('This demo holds up to 13 nodes. Reset to keep inserting.');
      return;
    }
    setError('');
    const res = insertAvlAnimated(tree, val);
    setTree(res.nextTree);
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const triggerPreset = (caseType: 'LL' | 'RR' | 'LR' | 'RL') => {
    const setup: Record<'LL' | 'RR' | 'LR' | 'RL', { base: number[]; trigger: number }> = {
      LL: { base: [30, 20], trigger: 10 },
      RR: { base: [10, 20], trigger: 30 },
      LR: { base: [30, 10], trigger: 20 },
      RL: { base: [10, 30], trigger: 20 },
    };
    const baseTree = buildFromSeq(setup[caseType].base);
    const res = insertAvlAnimated(baseTree, setup[caseType].trigger);
    setTree(res.nextTree);
    setInput(String(setup[caseType].trigger));
    setError('');
    setFrames(res.frames);
    player.restartAndPlay();
  };

  const reset = () => {
    const init = buildFromSeq(DEFAULT_KEYS);
    setTree(init);
    setInput('5');
    setError('');
    setFrames([
      {
        tree: init,
        active: null,
        rotated: [],
        unbalanced: null,
        note: 'Reset AVL tree. Try inserting 5 (LL) or clicking a rotation preset button.',
        codeLine: 0,
        rotations: 0,
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
          onKeyDown={(e) => e.key === 'Enter' && runInsertValue(Number(input))}
          inputMode="numeric"
          className="h-10 w-20 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
          aria-label="Key to insert into AVL tree"
        />
        <button type="button" onClick={() => runInsertValue(Number(input))} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert
        </button>
        <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
        {(['LL', 'RR', 'LR', 'RL'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => triggerPreset(p)}
            className="h-9 rounded-lg border border-white/10 bg-[#161B24] px-3 text-[12px] font-semibold text-slate-200 hover:border-amber-500/40 hover:text-amber-300"
          >
            Demo {p}
          </button>
        ))}
        <button type="button" onClick={reset} className="h-9 rounded-lg px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            <svg viewBox={`0 0 700 ${layout.height}`} className="mx-auto h-auto w-full max-w-[680px]" role="img" aria-label="AVL tree">
              {layout.nodes.map((node) => {
                if (node.parent === null) return null;
                const p = byVal.get(node.parent);
                if (!p) return null;
                const hi = current.rotated.includes(node.val) && current.rotated.includes(p.val);
                return (
                  <line
                    key={`${p.val}-${node.val}`}
                    x1={p.x}
                    y1={p.y}
                    x2={node.x}
                    y2={node.y}
                    className={hi ? 'stroke-amber-400' : 'stroke-slate-700'}
                    strokeWidth={hi ? 3 : 2}
                  />
                );
              })}
              {layout.nodes.map((node) => {
                const isUnbal = current.unbalanced === node.val || Math.abs(node.bf) > 1;
                const isRot = current.rotated.includes(node.val);
                const isAct = current.active === node.val;
                const cls = isUnbal
                  ? 'fill-rose-500 stroke-rose-400'
                  : isRot
                    ? 'fill-emerald-500 stroke-emerald-400'
                    : isAct
                      ? 'fill-amber-400 stroke-amber-300'
                      : 'fill-[#161B24] stroke-slate-600';
                const txt = isUnbal || isRot || isAct ? 'fill-stone-950 font-bold' : 'fill-slate-100 font-semibold';
                return (
                  <g key={node.val}>
                    <circle cx={node.x} cy={node.y} r={20} strokeWidth={2} className={cls} />
                    <text x={node.x} y={node.y + 5} textAnchor="middle" className={`text-[13px] ${txt}`}>
                      {node.val}
                    </text>
                    <text x={node.x + 22} y={node.y - 12} className="fill-amber-400 text-[10px] font-mono font-semibold">
                      bf:{node.bf > 0 ? `+${node.bf}` : node.bf}
                    </text>
                  </g>
                );
              })}
            </svg>
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
        code={CODE}
        codeLine={current.codeLine}
        stats={[
          { label: 'Nodes', value: layout.nodes.length },
          { label: 'Tree height', value: h(current.tree) },
          { label: 'Rotations', value: current.rotations },
          { label: 'Max |bf|', value: layout.nodes.reduce((m, n) => Math.max(m, Math.abs(n.bf)), 0) },
        ]}
      />
    </div>
  );
}
