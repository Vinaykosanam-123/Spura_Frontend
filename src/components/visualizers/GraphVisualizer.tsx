'use client';

import { useMemo, useState } from 'react';
import PlayerControls from '@/components/visualizers/PlayerControls';
import VisualizerBoard from '@/components/visualizers/VisualizerBoard';
import { useStepPlayer } from '@/components/visualizers/useStepPlayer';

type Algo = 'bfs' | 'dfs';
type NodeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

interface GraphFrame {
  visited: NodeId[];
  frontier: NodeId[];
  current: NodeId | null;
  edge: [NodeId, NodeId] | null;
  order: NodeId[];
  note: string;
  codeLine: number;
}

const NODES: { id: NodeId; x: number; y: number }[] = [
  { id: 'A', x: 70, y: 62 },
  { id: 'B', x: 280, y: 62 },
  { id: 'C', x: 520, y: 92 },
  { id: 'D', x: 70, y: 208 },
  { id: 'E', x: 280, y: 208 },
  { id: 'F', x: 520, y: 232 },
  { id: 'G', x: 120, y: 338 },
  { id: 'H', x: 352, y: 342 },
  { id: 'I', x: 562, y: 340 },
];

const EDGES: [NodeId, NodeId][] = [
  ['A', 'B'],
  ['A', 'D'],
  ['B', 'C'],
  ['B', 'E'],
  ['C', 'F'],
  ['D', 'E'],
  ['D', 'G'],
  ['E', 'F'],
  ['E', 'H'],
  ['F', 'I'],
  ['G', 'H'],
  ['H', 'I'],
];

const CODE: Record<Algo, string[]> = {
  bfs: [
    'BFS(start):',
    '  queue = [start]',
    '  visited = set()',
    '  while queue is not empty:',
    '    node = queue.dequeue()',
    '    if node in visited: continue',
    '    visited.add(node); visit(node)',
    '    for neighbor in node.neighbors:',
    '      if neighbor not visited: queue.enqueue(neighbor)',
  ],
  dfs: [
    'DFS(start):',
    '  stack = [start]',
    '  visited = set()',
    '  while stack is not empty:',
    '    node = stack.pop()',
    '    if node in visited: continue',
    '    visited.add(node); visit(node)',
    '    for neighbor in reversed(node.neighbors):',
    '      if neighbor not visited: stack.push(neighbor)',
  ],
};

const ADJ = new Map<NodeId, NodeId[]>();
for (const node of NODES) ADJ.set(node.id, []);
for (const [a, b] of EDGES) {
  ADJ.get(a)?.push(b);
  ADJ.get(b)?.push(a);
}

function frame(
  note: string,
  codeLine: number,
  opts: Partial<Pick<GraphFrame, 'visited' | 'frontier' | 'current' | 'edge' | 'order'>> = {}
): GraphFrame {
  return {
    visited: [...(opts.visited ?? [])],
    frontier: [...(opts.frontier ?? [])],
    current: opts.current ?? null,
    edge: opts.edge ?? null,
    order: [...(opts.order ?? [])],
    note,
    codeLine,
  };
}

function buildBfs(start: NodeId): GraphFrame[] {
  const frames: GraphFrame[] = [];
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>();
  const order: NodeId[] = [];
  frames.push(frame(`Start breadth-first search at ${start}. Enqueue the start node.`, 1, { frontier: [...queue] }));
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || visited.has(node)) continue;
    visited.add(node);
    order.push(node);
    frames.push(frame(`Dequeue ${node}, mark it visited, and look at its neighbours.`, 6, { visited: [...visited], frontier: [...queue], current: node, order: [...order] }));
    for (const neighbor of ADJ.get(node) ?? []) {
      if (!visited.has(neighbor) && !queue.includes(neighbor)) {
        queue.push(neighbor);
        frames.push(frame(`${node} → ${neighbor}: not discovered yet, so enqueue ${neighbor} at the back.`, 8, { visited: [...visited], frontier: [...queue], current: node, edge: [node, neighbor], order: [...order] }));
      }
    }
    frames.push(frame(`Finished exploring ${node}. The queue holds the next layer of the graph.`, 3, { visited: [...visited], frontier: [...queue], current: node, order: [...order] }));
  }
  frames.push(frame(`BFS complete. Visit order: ${order.join(' → ')}. BFS explores level by level.`, 3, { visited: [...visited], frontier: [], order }));
  return frames;
}

function buildDfs(start: NodeId): GraphFrame[] {
  const frames: GraphFrame[] = [];
  const stack: NodeId[] = [start];
  const visited = new Set<NodeId>();
  const order: NodeId[] = [];
  frames.push(frame(`Start depth-first search at ${start}. Put the start node on the stack.`, 1, { frontier: [...stack] }));
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || visited.has(node)) continue;
    visited.add(node);
    order.push(node);
    frames.push(frame(`Pop ${node} from the stack, mark it visited, and go deeper if possible.`, 6, { visited: [...visited], frontier: [...stack], current: node, order: [...order] }));
    const neighbors = ADJ.get(node) ?? [];
    for (const neighbor of [...neighbors].reverse()) {
      if (!visited.has(neighbor) && !stack.includes(neighbor)) {
        stack.push(neighbor);
        frames.push(frame(`${node} → ${neighbor}: push ${neighbor} so it is explored next.`, 8, { visited: [...visited], frontier: [...stack], current: node, edge: [node, neighbor], order: [...order] }));
      }
    }
    frames.push(frame(`Finished ${node}. The stack now holds the path back to unexplored branches.`, 3, { visited: [...visited], frontier: [...stack], current: node, order: [...order] }));
  }
  frames.push(frame(`DFS complete. Visit order: ${order.join(' → ')}. DFS follows one branch as deep as it can.`, 3, { visited: [...visited], frontier: [], order }));
  return frames;
}

function buildFrames(algo: Algo, start: NodeId): GraphFrame[] {
  return algo === 'bfs' ? buildBfs(start) : buildDfs(start);
}

export default function GraphVisualizer() {
  const [algo, setAlgo] = useState<Algo>('bfs');
  const [start, setStart] = useState<NodeId>('A');
  const frames = useMemo(() => buildFrames(algo, start), [algo, start]);
  const player = useStepPlayer(frames.length);
  const current = frames[Math.min(player.index, frames.length - 1)] ?? frames[0];

  const nodeById = new Map(NODES.map((n) => [n.id, n]));

  const choose = (next: Algo) => {
    setAlgo(next);
    player.restartAndPlay();
  };

  const chooseStart = (next: NodeId) => {
    setStart(next);
    player.restartAndPlay();
  };

  const reset = () => {
    setAlgo('bfs');
    setStart('A');
    player.reset();
  };

  const frontierLabel = algo === 'bfs' ? 'Queue' : 'Stack';
  const stats = [
    { label: 'Visited', value: current.visited.length },
    { label: `${frontierLabel} size`, value: current.frontier.length },
    { label: 'Start', value: start },
    { label: 'Order', value: current.order.join('·') || '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-white/10 bg-[#0F1319] p-0.5">
          {(['bfs', 'dfs'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => choose(a)}
              aria-pressed={algo === a}
              className={`h-8 rounded-full px-4 text-[13px] uppercase transition-colors ${
                algo === a
                  ? 'bg-amber-500 font-semibold text-stone-950'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-slate-300">
          Start
          <select
            value={start}
            onChange={(e) => chooseStart(e.target.value as NodeId)}
            className="h-9 rounded-xl border border-white/10 bg-[#0F1319] px-2.5 text-[13px] font-medium text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            {NODES.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={reset} className="h-9 rounded-xl border border-white/10 bg-[#161B24] px-3 text-[13px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-white">
          Reset
        </button>
        <span className="ml-auto text-[12px] text-amber-400/90 font-medium">
          {algo === 'bfs' ? 'Level by level' : 'Branch by branch'}
        </span>
      </div>

      <VisualizerBoard
        stage={
          <div className="w-full max-w-2xl">
            <svg viewBox="0 0 640 400" className="h-auto max-h-[400px] w-full" role="img" aria-label={`Graph ${algo.toUpperCase()} traversal from ${start}`}>
              {EDGES.map(([a, b]) => {
                const na = nodeById.get(a);
                const nb = nodeById.get(b);
                if (!na || !nb) return null;
                const active =
                  current.edge &&
                  ((current.edge[0] === a && current.edge[1] === b) || (current.edge[0] === b && current.edge[1] === a));
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    className={active ? 'stroke-amber-400' : 'stroke-slate-700'}
                    strokeWidth={active ? 4 : 2}
                  />
                );
              })}
              {NODES.map((node) => {
                const isCurrent = current.current === node.id;
                const isVisited = current.visited.includes(node.id);
                const isFrontier = current.frontier.includes(node.id);
                const fill = isCurrent
                  ? 'fill-amber-400 stroke-amber-300'
                  : isVisited
                    ? 'fill-emerald-500 stroke-emerald-400'
                    : isFrontier
                      ? 'fill-orange-950 stroke-orange-400'
                      : 'fill-[#161B24] stroke-slate-600';
                return (
                  <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r={22} strokeWidth={2} className={fill} />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      className={isCurrent || isVisited ? 'fill-stone-950 text-[13px] font-bold' : 'fill-slate-100 text-[13px] font-semibold'}
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> current</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> in {frontierLabel.toLowerCase()}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> visited</span>
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
        code={CODE[algo]}
        codeLine={current.codeLine}
        stats={stats}
        extra={
          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{frontierLabel}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {current.frontier.length === 0 ? (
                  <span className="text-[12px] text-slate-500">empty</span>
                ) : (
                  current.frontier.map((id, i) => (
                    <span key={`${id}-${i}`} className="rounded-md border border-orange-500/30 bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-200">
                      {id}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visit order</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {current.order.length === 0 ? (
                  <span className="text-[12px] text-slate-500">—</span>
                ) : (
                  current.order.map((id, i) => (
                    <span key={`${id}-${i}`} className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                      {id}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
