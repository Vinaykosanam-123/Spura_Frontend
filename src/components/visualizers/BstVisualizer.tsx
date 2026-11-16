'use client';

import { useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

interface BstNode {
  value: number;
  left: BstNode | null;
  right: BstNode | null;
}

type Op = 'insert' | 'search' | 'inorder' | 'preorder' | 'postorder';

interface BstFrame {
  tree: BstNode;
  active: number | null;
  path: number[];
  visited: number[];
  inserted: number | null;
  found: number | null;
  output: number[];
  note: string;
  codeLine: number;
  comparisons: number;
}

const CODE: Record<Op, string[]> = {
  insert: [
    'insert(node, value):',
    '  if node is null: return Node(value)',
    '  if value == node.value: return node',
    '  if value < node.value:',
    '    node.left = insert(node.left, value)',
    '  else:',
    '    node.right = insert(node.right, value)',
    '  return node',
  ],
  search: [
    'search(node, value):',
    '  if node is null: return null',
    '  if value == node.value: return node',
    '  if value < node.value: return search(node.left, value)',
    '  return search(node.right, value)',
  ],
  inorder: [
    'inorder(node):',
    '  if node is null: return',
    '  inorder(node.left)',
    '  visit(node)',
    '  inorder(node.right)',
  ],
  preorder: [
    'preorder(node):',
    '  if node is null: return',
    '  visit(node)',
    '  preorder(node.left)',
    '  preorder(node.right)',
  ],
  postorder: [
    'postorder(node):',
    '  if node is null: return',
    '  postorder(node.left)',
    '  postorder(node.right)',
    '  visit(node)',
  ],
};

const OP_LABEL: Record<Op, string> = {
  insert: 'Insert',
  search: 'Search',
  inorder: 'Inorder',
  preorder: 'Preorder',
  postorder: 'Postorder',
};

const START_VALUES = [50, 30, 70, 20, 40, 60, 80];

function buildTree(values: number[]): BstNode | null {
  let root: BstNode | null = null;
  for (const value of values) root = insertNode(root, value);
  return root;
}

function insertNode(node: BstNode | null, value: number): BstNode {
  if (!node) return { value, left: null, right: null };
  if (value < node.value) return { ...node, left: insertNode(node.left, value) };
  if (value > node.value) return { ...node, right: insertNode(node.right, value) };
  return node;
}

function countNodes(node: BstNode | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function treeHeight(node: BstNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

function frame(
  tree: BstNode | null,
  note: string,
  codeLine: number,
  opts: Partial<Pick<BstFrame, 'active' | 'path' | 'visited' | 'inserted' | 'found' | 'output' | 'comparisons'>> = {}
): BstFrame {
  return {
    tree: tree ?? { value: -1, left: null, right: null },
    active: opts.active ?? null,
    path: [...(opts.path ?? [])],
    visited: [...(opts.visited ?? [])],
    inserted: opts.inserted ?? null,
    found: opts.found ?? null,
    output: [...(opts.output ?? [])],
    note,
    codeLine,
    comparisons: opts.comparisons ?? 0,
  };
}

function buildInsert(root: BstNode | null, value: number): { frames: BstFrame[]; tree: BstNode } {
  const frames: BstFrame[] = [];
  let comparisons = 0;
  if (!root) {
    const tree = insertNode(null, value);
    frames.push(frame(tree, `${value} becomes the root because the tree is empty.`, 1, { inserted: value, path: [value] }));
    return { frames, tree };
  }
  frames.push(frame(root, `Start at the root, ${root.value}. Every comparison discards one subtree.`, 0, { active: root.value, path: [root.value] }));
  let current: BstNode | null = root;
  const path: number[] = [];
  while (current) {
    comparisons++;
    path.push(current.value);
    frames.push(
      frame(root, `Compare ${value} with ${current.value}. ${value === current.value ? 'They are equal.' : value < current.value ? 'Go left.' : 'Go right.'}`, 2, {
        active: current.value,
        path: [...path],
        comparisons,
      })
    );
    if (value === current.value) {
      frames.push(frame(root, `${value} is already in the tree. BSTs used for sets keep keys unique.`, 2, { found: value, path: [...path], comparisons }));
      return { frames, tree: root };
    }
    if (value < current.value) {
      if (!current.left) {
        const tree = insertNode(root, value);
        frames.push(frame(tree, `The left child of ${current.value} is null. Insert ${value} here.`, 1, { inserted: value, path: [...path, value], comparisons }));
        return { frames, tree };
      }
      frames.push(frame(root, `${value} is smaller, so follow the left pointer to ${current.left.value}.`, 4, { active: current.value, path: [...path], comparisons }));
      current = current.left;
    } else {
      if (!current.right) {
        const tree = insertNode(root, value);
        frames.push(frame(tree, `The right child of ${current.value} is null. Insert ${value} here.`, 1, { inserted: value, path: [...path, value], comparisons }));
        return { frames, tree };
      }
      frames.push(frame(root, `${value} is larger, so follow the right pointer to ${current.right.value}.`, 6, { active: current.value, path: [...path], comparisons }));
      current = current.right;
    }
  }
  const tree = insertNode(root, value);
  frames.push(frame(tree, `Insert ${value}.`, 1, { inserted: value, path: [...path, value], comparisons }));
  return { frames, tree };
}

function buildSearch(root: BstNode | null, value: number): BstFrame[] {
  const frames: BstFrame[] = [];
  let comparisons = 0;
  const path: number[] = [];
  frames.push(frame(root, `Start at the root and compare ${value} with each node.`, 0, root ? { active: root.value, path: [root.value] } : {}));
  let current: BstNode | null = root;
  while (current) {
    comparisons++;
    path.push(current.value);
    frames.push(frame(root, `Compare ${value} with ${current.value}.`, 2, { active: current.value, path: [...path], comparisons }));
    if (value === current.value) {
      frames.push(frame(root, `Found ${value} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}. Search cost is O(log n) when the tree is balanced.`, 2, { found: value, path: [...path], comparisons }));
      return frames;
    }
    if (value < current.value) {
      frames.push(frame(root, `${value} < ${current.value}; follow the left pointer.`, 3, { active: current.value, path: [...path], comparisons }));
      current = current.left;
    } else {
      frames.push(frame(root, `${value} > ${current.value}; follow the right pointer.`, 4, { active: current.value, path: [...path], comparisons }));
      current = current.right;
    }
  }
  frames.push(frame(root, `Reached null. ${value} is not in the tree after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`, 1, { path: [...path], comparisons }));
  return frames;
}

function buildTraversal(root: BstNode | null, type: 'inorder' | 'preorder' | 'postorder'): BstFrame[] {
  const frames: BstFrame[] = [];
  const output: number[] = [];
  frames.push(frame(root, `${OP_LABEL[type]} traversal. The output grows one visit at a time.`, 0));
  const visitLine = type === 'inorder' ? 3 : type === 'preorder' ? 2 : 4;
  const walk = (node: BstNode | null) => {
    if (!node) return;
    if (type === 'preorder') visit(node);
    walk(node.left);
    if (type === 'inorder') visit(node);
    walk(node.right);
    if (type === 'postorder') visit(node);
  };
  const visit = (node: BstNode) => {
    output.push(node.value);
    frames.push(
      frame(root, `Visit ${node.value}. Output so far: [${output.join(', ')}].`, visitLine, {
        active: node.value,
        visited: [...output],
        output: [...output],
      })
    );
  };
  walk(root);
  frames.push(frame(root, `${OP_LABEL[type]} complete: [${output.join(', ')}]. Each node is visited exactly once, so every traversal is O(n).`, visitLine, { visited: [...output], output: [...output] }));
  return frames;
}

interface LayoutNode {
  value: number;
  x: number;
  y: number;
  depth: number;
  parent: number | null;
}

function layoutTree(root: BstNode): { nodes: LayoutNode[]; radius: number; height: number } {
  const nodes: LayoutNode[] = [];
  const walk = (node: BstNode | null, depth: number, parent: number | null) => {
    if (!node) return;
    walk(node.left, depth + 1, node.value);
    nodes.push({ value: node.value, x: 0, y: 0, depth, parent });
    walk(node.right, depth + 1, node.value);
  };
  walk(root, 0, null);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const yGap = Math.min(64, 290 / Math.max(1, maxDepth));
  const radius = Math.min(20, Math.max(12, yGap * 0.38));
  nodes.forEach((node, i) => {
    node.x = nodes.length === 1 ? 350 : 50 + (i * 600) / (nodes.length - 1);
    node.y = 40 + node.depth * yGap;
  });
  const height = Math.max(180, 40 + maxDepth * yGap + 60);
  return { nodes, radius, height };
}

export default function BstVisualizer() {
  const [tree, setTree] = useState<BstNode | null>(() => buildTree(START_VALUES));
  const [input, setInput] = useState('45');
  const [op, setOp] = useState<Op>('search');
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<BstFrame[]>(() => {
    const initial = buildTree(START_VALUES);
    return [frame(initial, 'A binary search tree keeps smaller keys left and larger keys right. Insert or search for a value to see the comparison path.', 0, { active: 50, path: [50] })];
  });
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

  const runInsert = () => {
    const value = readValue();
    if (value === null) return;
    if (tree && countNodes(tree) >= 14) {
      setError('This demo holds up to 14 nodes. Reset the tree to keep exploring.');
      return;
    }
    const result = buildInsert(tree, value);
    setTree(result.tree);
    setOp('insert');
    setFrames(result.frames);
    player.restartAndPlay();
  };

  const runSearch = () => {
    const value = readValue();
    if (value === null) return;
    setOp('search');
    setFrames(buildSearch(tree, value));
    player.restartAndPlay();
  };

  const runTraversal = (type: 'inorder' | 'preorder' | 'postorder') => {
    setOp(type);
    setFrames(buildTraversal(tree, type));
    player.restartAndPlay();
  };

  const reset = () => {
    const initial = buildTree(START_VALUES);
    setTree(initial);
    setFrames([frame(initial, 'Reset to a balanced tree: 50 at the root, with smaller values left and larger values right.', 0, { active: 50, path: [50] })]);
    setOp('search');
    setError('');
    player.reset();
  };

  const safeTree = current.tree.value === -1 && !tree ? null : current.tree;
  const layout = layoutTree(safeTree ?? (tree as BstNode));
  const byValue = new Map(layout.nodes.map((n) => [n.value, n]));
  const maxDepth = layout.nodes.reduce((m, n) => Math.max(m, n.depth), 0);

  const nodeClass = (value: number) => {
    if (current.inserted === value || current.found === value) return 'fill-emerald-500 stroke-emerald-400';
    if (current.active === value) return 'fill-amber-400 stroke-amber-300';
    if (current.visited.includes(value)) return 'fill-emerald-950 stroke-emerald-500';
    if (current.path.includes(value)) return 'fill-orange-950 stroke-orange-400';
    return 'fill-[#161B24] stroke-slate-600';
  };

  const textClass = (value: number) => {
    if (current.inserted === value || current.found === value || current.active === value) return 'fill-stone-950 font-bold';
    return 'fill-slate-100 font-medium';
  };

  const stats = [
    { label: 'Comparisons', value: current.comparisons },
    { label: 'Nodes', value: countNodes(safeTree) },
    { label: 'Height', value: treeHeight(safeTree) },
    { label: 'Operation', value: OP_LABEL[op] },
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
              if (e.key === 'Enter') runSearch();
            }}
            inputMode="numeric"
            className="h-10 w-20 rounded-xl border border-white/10 bg-[#0F1319] px-3 text-center text-[14px] tabular-nums text-slate-100 focus:border-amber-500 focus:outline-none"
            aria-label="Value to insert or search"
          />
        </label>
        <button type="button" onClick={runInsert} className="h-10 rounded-xl bg-amber-500 px-4 text-[13px] font-semibold text-stone-950 hover:bg-amber-400">
          Insert
        </button>
        <button type="button" onClick={runSearch} className="h-10 rounded-xl border border-white/10 bg-[#161B24] px-4 text-[13px] font-medium text-slate-200 hover:border-amber-500/40 hover:text-white">
          Search
        </button>
        <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
        {(['inorder', 'preorder', 'postorder'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => runTraversal(type)}
            className={`h-10 rounded-xl border px-3 text-[13px] capitalize transition-colors ${
              op === type
                ? 'border-amber-500 bg-amber-500 font-semibold text-stone-950'
                : 'border-white/10 bg-[#161B24] font-medium text-slate-300 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
        <button type="button" onClick={reset} className="h-10 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          Reset tree
        </button>
      </div>
      {error && <p className="text-[13px] text-rose-400">{error}</p>}

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            <svg viewBox={`0 0 700 ${layout.height}`} className="mx-auto h-auto w-full max-w-[680px]" role="img" aria-label={`Binary search tree with ${countNodes(safeTree)} nodes`}>
              {layout.nodes.map((node) => {
                if (node.parent === null) return null;
                const parent = byValue.get(node.parent);
                if (!parent) return null;
                const activeEdge =
                  (current.active === node.value && current.path.includes(node.parent)) ||
                  (current.active === node.parent && current.path.includes(node.value));
                return (
                  <line
                    key={`${node.parent}-${node.value}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={node.x}
                    y2={node.y}
                    className={activeEdge ? 'stroke-amber-400' : 'stroke-slate-700'}
                    strokeWidth={activeEdge ? 3 : 2}
                  />
                );
              })}
              {layout.nodes.map((node) => (
                <g key={node.value}>
                  <circle cx={node.x} cy={node.y} r={layout.radius} strokeWidth={2} className={nodeClass(node.value)} />
                  <text
                    x={node.x}
                    y={node.y + layout.radius * 0.28}
                    textAnchor="middle"
                    className={textClass(node.value)}
                    style={{ fontSize: `${Math.min(15, layout.radius * 0.82)}px` }}
                  >
                    {node.value}
                  </text>
                </g>
              ))}
            </svg>
            {(current.output.length > 0 || current.path.length > 0) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#0F1319] px-3 py-2">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                  {current.output.length > 0 ? 'Output' : 'Path'}
                </span>
                {(current.output.length > 0 ? current.output : current.path).map((value, i) => (
                  <span key={`${value}-${i}`} className="rounded-md border border-white/10 bg-[#161B24] px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-200">
                    {value}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              {maxDepth + 1} level{maxDepth === 0 ? '' : 's'} · smaller keys go left, larger keys go right
            </p>
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
