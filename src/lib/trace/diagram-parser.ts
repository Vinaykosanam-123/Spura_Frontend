import type { HeapObject, TraceStep, TraceValue } from "./types";

export type DiagramType = "array_pointers" | "linked_list" | "binary_tree" | "stack" | "graph";

/**
 * Diagrammatic Models extracted from raw execution traces.
 */

// 1. Linked List Node & Chain
export interface DiagramListNode {
  id: string;
  val: string;
  nextId: string | null;
  pointers: string[]; // names of variables pointing to this node (e.g. ['head', 'curr'])
}

export interface DiagramLinkedList {
  nodes: DiagramListNode[];
  name: string;
}

// 2. Array with Pointer Arrows
export interface DiagramPointer {
  name: string;
  index: number;
  color: string;
}

export interface DiagramArray {
  id: string;
  name: string;
  items: Array<{ index: number; value: string; isHighlighted?: boolean }>;
  pointers: DiagramPointer[];
  activeRange?: { start: number; end: number };
}

// 3. Binary Tree Node
export interface DiagramTreeNode {
  id: string;
  val: string;
  leftId: string | null;
  rightId: string | null;
  pointers: string[];
  x?: number;
  y?: number;
}

export interface DiagramTree {
  rootId: string;
  nodes: Record<string, DiagramTreeNode>;
  name: string;
}

// 4. Stack Container
export interface DiagramStack {
  name: string;
  items: string[];
}

export interface DiagramDictOrSet {
  name: string;
  kind: "dict" | "set";
  entries: Array<{ key: string; value: string }>;
  items: string[];
}

export interface DiagramFrameWatch {
  name: string;
  line: number;
  vars: Array<{ name: string; value: string; isRef: boolean }>;
}

// 5. Recursion Call Tree Node
export interface RecursionTreeNode {
  id: string;
  name: string;
  args: string;
  returnValue?: string;
  status: "active" | "returned" | "waiting";
  children: RecursionTreeNode[];
  depth: number;
}

const POINTER_COLORS = [
  "#f59e0b", // amber
  "#10b981", // emerald
  "#fb923c", // orange
  "#2dd4bf", // teal
  "#f43f5e", // rose
  "#eab308", // gold
  "#34d399", // mint
];

/**
 * Helper to unwrap TraceValue to a human readable display string.
 */
export function traceValToString(val: TraceValue | undefined, heap: Record<string, HeapObject | null>): string {
  if (!val) return "undefined";
  if (val.t === "p") return val.r;
  const obj = heap[val.id];
  if (!obj) return `#${val.id}`;
  if (obj.kind === "list" || obj.kind === "tuple" || obj.kind === "deque") {
    return `[${obj.items.map((i) => traceValToString(i, heap)).join(", ")}]`;
  }
  if (obj.kind === "set" || obj.kind === "frozenset") {
    return `{${obj.items.map((i) => traceValToString(i, heap)).join(", ")}}`;
  }
  if (obj.kind === "dict") {
    return `{${obj.entries.map(([k, v]) => `${traceValToString(k, heap)}: ${traceValToString(v, heap)}`).join(", ")}}`;
  }
  if (obj.kind === "object") return `${obj.cls} #${val.id}`;
  return `#${val.id}`;
}

/**
 * Detects and extracts Linked Lists from current step heap & stack.
 */
export function extractLinkedLists(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramLinkedList[] {
  const lists: DiagramLinkedList[] = [];
  const visitedNodes = new Set<string>();

  // Find all objects in heap that look like a ListNode (has .val or .data, and .next)
  const listNodeIds = new Set<string>();
  for (const [id, obj] of Object.entries(heap)) {
    if (obj && obj.kind === "object") {
      const fieldNames = obj.fields.map((f) => f[0]);
      if (
        (fieldNames.includes("val") || fieldNames.includes("value") || fieldNames.includes("data")) &&
        fieldNames.includes("next")
      ) {
        listNodeIds.add(id);
      }
    }
  }

  if (listNodeIds.size === 0) return [];

  // Map pointer variable names from stack to node ids
  const pointerMap = new Map<string, string[]>(); // nodeId -> ['head', 'curr']
  for (const frame of step.stack) {
    for (const [name, val] of frame.vars) {
      if (val.t === "r" && listNodeIds.has(val.id)) {
        const existing = pointerMap.get(val.id) || [];
        if (!existing.includes(name)) existing.push(name);
        pointerMap.set(val.id, existing);
      }
    }
  }

  // Find head nodes (nodes not pointed to by any other node's .next)
  const pointedTo = new Set<string>();
  for (const id of listNodeIds) {
    const obj = heap[id];
    if (obj && obj.kind === "object") {
      const nextField = obj.fields.find((f) => f[0] === "next");
      if (nextField && nextField[1].t === "r" && listNodeIds.has(nextField[1].id)) {
        pointedTo.add(nextField[1].id);
      }
    }
  }

  // Candidate heads: nodes that are in listNodeIds but not pointed to, or referenced by variables
  let candidateHeads = [...listNodeIds].filter((id) => !pointedTo.has(id));
  if (candidateHeads.length === 0) candidateHeads = [...listNodeIds];

  for (const headId of candidateHeads) {
    if (visitedNodes.has(headId)) continue;

    const chain: DiagramListNode[] = [];
    let currId: string | null = headId;
    let guard = 0;

    while (currId && guard < 50) {
      guard++;
      const currentKey: string = currId;
      if (chain.some((n) => n.id === currentKey)) {
        // cycle detected
        break;
      }
      visitedNodes.add(currentKey);
      const obj: HeapObject | null | undefined = heap[currentKey];
      if (!obj || obj.kind !== "object") break;

      const valField: [string, TraceValue] | undefined = obj.fields.find(
        (f: [string, TraceValue]) => f[0] === "val" || f[0] === "value" || f[0] === "data"
      );
      const nextField: [string, TraceValue] | undefined = obj.fields.find(
        (f: [string, TraceValue]) => f[0] === "next"
      );

      const valStr: string = valField ? traceValToString(valField[1], heap) : "?";
      const nextId: string | null = nextField && nextField[1].t === "r" ? nextField[1].id : null;

      chain.push({
        id: currentKey,
        val: valStr,
        nextId,
        pointers: pointerMap.get(currentKey) || [],
      });

      currId = nextId;
    }

    if (chain.length > 0) {
      // Find list name from pointer on head, or default
      const headPointers = pointerMap.get(headId) || [];
      const listName = headPointers.length > 0 ? headPointers.join(" / ") : `Linked List (${chain.length} nodes)`;
      lists.push({ name: listName, nodes: chain });
    }
  }

  return lists;
}

/**
 * Detects and extracts Arrays/Lists with pointer variables (like i, j, left, right, mid).
 */
export function extractArraysWithPointers(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramArray[] {
  const result: DiagramArray[] = [];

  // Gather integer variables from stack frames
  const intVars: Array<{ name: string; val: number }> = [];
  const arrayRefs = new Map<string, { name: string; id: string }>();

  for (const frame of step.stack) {
    for (const [name, val] of frame.vars) {
      if (val.t === "p" && typeof val.n === "number" && Number.isInteger(val.n)) {
        intVars.push({ name, val: val.n });
      } else if (val.t === "r") {
        const obj = heap[val.id];
        if (obj && (obj.kind === "list" || obj.kind === "tuple")) {
          if (!arrayRefs.has(val.id)) {
            arrayRefs.set(val.id, { name, id: val.id });
          }
        }
      }
    }
  }

  let colorIdx = 0;

  for (const [id, { name }] of arrayRefs.entries()) {
    const obj = heap[id];
    if (!obj || (obj.kind !== "list" && obj.kind !== "tuple")) continue;

    const items = obj.items.map((it, idx) => ({
      index: idx,
      value: traceValToString(it, heap),
    }));

    // Find pointers pointing to this array's valid indices
    const pointers: DiagramPointer[] = [];
    for (const { name: varName, val } of intVars) {
      if (val >= 0 && val < items.length) {
        // Exclude common non-pointer counters unless they make sense
        pointers.push({
          name: varName,
          index: val,
          color: POINTER_COLORS[colorIdx % POINTER_COLORS.length],
        });
        colorIdx++;
      }
    }

    // Check for binary search / two pointers active range [left, right]
    let activeRange: { start: number; end: number } | undefined;
    const leftVar = intVars.find((v) => v.name.toLowerCase() === "left" || v.name.toLowerCase() === "lo");
    const rightVar = intVars.find((v) => v.name.toLowerCase() === "right" || v.name.toLowerCase() === "hi");
    if (leftVar && rightVar && leftVar.val <= rightVar.val) {
      activeRange = { start: Math.max(0, leftVar.val), end: Math.min(items.length - 1, rightVar.val) };
    }

    result.push({
      id,
      name,
      items,
      pointers,
      activeRange,
    });
  }

  return result;
}

/**
 * Detects and extracts Binary Trees.
 */
export function extractBinaryTrees(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramTree[] {
  const trees: DiagramTree[] = [];
  const treeNodeIds = new Set<string>();

  for (const [id, obj] of Object.entries(heap)) {
    if (obj && obj.kind === "object") {
      const fieldNames = obj.fields.map((f) => f[0]);
      if (
        (fieldNames.includes("val") || fieldNames.includes("value")) &&
        fieldNames.includes("left") &&
        fieldNames.includes("right")
      ) {
        treeNodeIds.add(id);
      }
    }
  }

  if (treeNodeIds.size === 0) return [];

  // Pointer map
  const pointerMap = new Map<string, string[]>();
  for (const frame of step.stack) {
    for (const [name, val] of frame.vars) {
      if (val.t === "r" && treeNodeIds.has(val.id)) {
        const existing = pointerMap.get(val.id) || [];
        if (!existing.includes(name)) existing.push(name);
        pointerMap.set(val.id, existing);
      }
    }
  }

  // Find root candidates (nodes not pointed to as left/right child)
  const children = new Set<string>();
  for (const id of treeNodeIds) {
    const obj = heap[id];
    if (obj && obj.kind === "object") {
      const left = obj.fields.find((f) => f[0] === "left");
      const right = obj.fields.find((f) => f[0] === "right");
      if (left && left[1].t === "r") children.add(left[1].id);
      if (right && right[1].t === "r") children.add(right[1].id);
    }
  }

  let roots = [...treeNodeIds].filter((id) => !children.has(id));
  if (roots.length === 0) roots = [[...treeNodeIds][0]];

  for (const rootId of roots) {
    const nodes: Record<string, DiagramTreeNode> = {};
    const queue = [rootId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const obj = heap[currId];
      if (!obj || obj.kind !== "object") continue;

      const valField = obj.fields.find((f) => f[0] === "val" || f[0] === "value");
      const leftField = obj.fields.find((f) => f[0] === "left");
      const rightField = obj.fields.find((f) => f[0] === "right");

      const leftId = leftField && leftField[1].t === "r" && treeNodeIds.has(leftField[1].id) ? leftField[1].id : null;
      const rightId = rightField && rightField[1].t === "r" && treeNodeIds.has(rightField[1].id) ? rightField[1].id : null;

      nodes[currId] = {
        id: currId,
        val: valField ? traceValToString(valField[1], heap) : "?",
        leftId,
        rightId,
        pointers: pointerMap.get(currId) || [],
      };

      if (leftId) queue.push(leftId);
      if (rightId) queue.push(rightId);
    }

    const rootPointers = pointerMap.get(rootId) || [];
    const treeName = rootPointers.length > 0 ? rootPointers[0] : "Binary Tree";
    trees.push({ rootId, nodes, name: treeName });
  }

  return trees;
}

/**
 * Detects and extracts Stacks / Queues / Priority Queues from deque objects or stack/queue-named lists.
 */
export function extractStacks(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramStack[] {
  const stacks: DiagramStack[] = [];
  const seenIds = new Set<string>();

  for (const frame of step.stack) {
    for (const [name, val] of frame.vars) {
      if (val.t !== "r" || seenIds.has(val.id)) continue;
      const obj = heap[val.id];
      if (!obj) continue;
      const lower = name.toLowerCase();
      const isStackNamed =
        lower.includes("stack") ||
        lower === "st" ||
        lower.includes("queue") ||
        lower === "q" ||
        lower.includes("deque") ||
        lower === "pq" ||
        lower.includes("heap");

      if (obj.kind === "deque" || (obj.kind === "list" && isStackNamed)) {
        seenIds.add(val.id);
        stacks.push({
          name,
          items: obj.items.map((it) => traceValToString(it, heap)),
        });
      }
    }
  }

  return stacks;
}

/**
 * Extracts Maps/Dicts and Sets from the current execution step.
 */
export function extractDictsAndSets(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramDictOrSet[] {
  const out: DiagramDictOrSet[] = [];
  const seenIds = new Set<string>();

  for (const frame of step.stack) {
    for (const [name, val] of frame.vars) {
      if (val.t !== "r" || seenIds.has(val.id)) continue;
      const obj = heap[val.id];
      if (!obj) continue;
      if (obj.kind === "dict") {
        seenIds.add(val.id);
        out.push({
          name,
          kind: "dict",
          entries: obj.entries.map(([k, v]) => ({
            key: traceValToString(k, heap),
            value: traceValToString(v, heap),
          })),
          items: [],
        });
      } else if (obj.kind === "set" || obj.kind === "frozenset") {
        seenIds.add(val.id);
        out.push({
          name,
          kind: "set",
          entries: [],
          items: obj.items.map((it) => traceValToString(it, heap)),
        });
      }
    }
  }

  return out;
}

/**
 * Extracts all active call frames & local variable watches for universal step tracing.
 */
export function extractFrameWatches(
  step: TraceStep,
  heap: Record<string, HeapObject | null>
): DiagramFrameWatch[] {
  return step.stack.map((frame) => ({
    name: frame.name || "main",
    line: frame.line,
    vars: frame.vars.map(([name, val]) => ({
      name,
      value: traceValToString(val, heap),
      isRef: val.t === "r",
    })),
  }));
}

/**
 * Builds Recursion Tree by scanning the execution trace up to current step.
 */
export function buildRecursionTree(steps: TraceStep[], currentStepIdx: number): RecursionTreeNode | null {
  if (steps.length === 0) return null;

  // Track function calls that have depth > 1 (excluding global)
  const currentStep = steps[currentStepIdx];
  if (!currentStep) return null;

  // Root synthetic node
  const rootNode: RecursionTreeNode = {
    id: "root",
    name: "main",
    args: "()",
    status: "active",
    children: [],
    depth: 0,
  };

  const stack: RecursionTreeNode[] = [rootNode];
  let nodeIdSeq = 1;

  for (let i = 0; i <= currentStepIdx; i++) {
    const step = steps[i];
    const frameDepth = step.stack.length;

    // Detect function invocation / push
    if (frameDepth > stack.length) {
      const topFrame = step.stack[step.stack.length - 1];
      const argsStr = topFrame.vars.map(([k, v]) => `${k}=${v.t === "p" ? v.r : "#" + v.id}`).join(", ");
      const newNode: RecursionTreeNode = {
        id: `call-${nodeIdSeq++}`,
        name: topFrame.name,
        args: `(${argsStr})`,
        status: i === currentStepIdx ? "active" : "waiting",
        children: [],
        depth: stack.length,
      };
      stack[stack.length - 1].children.push(newNode);
      stack.push(newNode);
    } else if (frameDepth < stack.length) {
      // Function return / pop
      const popped = stack.pop();
      if (popped && step.event === "return") {
        popped.status = "returned";
        const returningFrame = step.stack[step.stack.length - 1];
        if (returningFrame?.ret) {
          popped.returnValue = traceValToString(returningFrame.ret, step.heap);
        }
      }
    } else if (step.event === "return" && stack.length > 1) {
      const current = stack[stack.length - 1];
      current.status = "returned";
      const frame = step.stack[step.stack.length - 1];
      if (frame?.ret) {
        current.returnValue = traceValToString(frame.ret, step.heap);
      }
    }
  }

  return rootNode.children.length > 0 ? rootNode.children[0] : null;
}
