export type VisualizerSlug =
  | 'sorting'
  | 'stack-queue'
  | 'linked-list'
  | 'bst'
  | 'graph'
  | 'heap'
  | 'avl'
  | 'trie'
  | 'recursion'
  | 'dp'
  | 'hash';

export type VisualizerCategory = 'All' | 'Arrays & Hashing' | 'Linear' | 'Trees & Tries' | 'Graphs & DP';

export interface VisualizerMeta {
  slug: VisualizerSlug;
  title: string;
  tagline: string;
  description: string;
  topic: string;
  category: Exclude<VisualizerCategory, 'All'>;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  covers: string[];
  accent: 'amber' | 'emerald' | 'orange' | 'rose' | 'teal';
}

export const VISUALIZERS: VisualizerMeta[] = [
  {
    slug: 'sorting',
    title: 'Sorting algorithms',
    tagline: 'Watch comparisons, swaps and partitions happen.',
    description:
      'Walk through bubble, selection, insertion, merge and quick sort one step at a time. See exactly which elements are compared, which are swapped, and how the sorted region grows.',
    topic: 'Arrays & sorting',
    category: 'Arrays & Hashing',
    level: 'Beginner',
    duration: '8 min',
    covers: ['Bubble', 'Selection', 'Insertion', 'Merge', 'Quick'],
    accent: 'emerald',
  },
  {
    slug: 'stack-queue',
    title: 'Stack & queue',
    tagline: 'LIFO and FIFO, made physical.',
    description:
      'Push, pop, enqueue and dequeue values and watch the shape of the data change. A running log connects every operation back to its O(1) cost and its LIFO or FIFO rule.',
    topic: 'Linear data structures',
    category: 'Linear',
    level: 'Beginner',
    duration: '6 min',
    covers: ['Push', 'Pop', 'Enqueue', 'Dequeue'],
    accent: 'amber',
  },
  {
    slug: 'linked-list',
    title: 'Linked list',
    tagline: 'Follow the pointers, not the indices.',
    description:
      'Insert at the head or tail, delete a value and search the list while every pointer rewrite is highlighted. See why head insertion is O(1) and traversal is O(n).',
    topic: 'Linear data structures',
    category: 'Linear',
    level: 'Beginner',
    duration: '7 min',
    covers: ['Insert', 'Delete', 'Search', 'Pointers'],
    accent: 'orange',
  },
  {
    slug: 'bst',
    title: 'Binary search tree',
    tagline: 'One comparison per level.',
    description:
      'Insert and search values, then run inorder, preorder and postorder traversals. The comparison path lights up so the O(log n) search bound feels inevitable.',
    topic: 'Trees',
    category: 'Trees & Tries',
    level: 'Intermediate',
    duration: '9 min',
    covers: ['Insert', 'Search', 'Inorder', 'Preorder', 'Postorder'],
    accent: 'amber',
  },
  {
    slug: 'graph',
    title: 'Graph traversal',
    tagline: 'BFS explores wide. DFS goes deep.',
    description:
      'Run breadth-first and depth-first search on the same graph and compare the order nodes are discovered. The queue or stack stays visible beside the graph.',
    topic: 'Graphs',
    category: 'Graphs & DP',
    level: 'Intermediate',
    duration: '8 min',
    covers: ['BFS', 'DFS', 'Queue', 'Stack'],
    accent: 'rose',
  },
  {
    slug: 'heap',
    title: 'Binary heap',
    tagline: 'The tree that lives inside an array.',
    description:
      'Insert and extract from a min-heap or max-heap while the sift-up and sift-down paths light up. The same values are shown as a complete tree and as the backing array.',
    topic: 'Heaps & priority queues',
    category: 'Trees & Tries',
    level: 'Intermediate',
    duration: '9 min',
    covers: ['Insert', 'Extract', 'Sift up', 'Sift down', 'Array view'],
    accent: 'teal',
  },
  {
    slug: 'avl',
    title: 'AVL tree rotations',
    tagline: 'Stay balanced, one rotation at a time.',
    description:
      'Insert values and watch balance factors update on the way back up. When a node tips past ±1, LL, RR, LR and RL rotations restore the height bound.',
    topic: 'Trees',
    category: 'Trees & Tries',
    level: 'Advanced',
    duration: '12 min',
    covers: ['Insert', 'Balance factor', 'LL', 'RR', 'LR', 'RL'],
    accent: 'orange',
  },
  {
    slug: 'trie',
    title: 'Trie (prefix tree)',
    tagline: 'Share the prefix, split only when you must.',
    description:
      'Insert and look up words character by character. Nodes are reused when a prefix already exists, and terminal markers show where a complete word ends.',
    topic: 'Strings & trees',
    category: 'Trees & Tries',
    level: 'Intermediate',
    duration: '9 min',
    covers: ['Insert', 'Search', 'Starts with', 'Prefixes'],
    accent: 'emerald',
  },
  {
    slug: 'recursion',
    title: 'Recursion & call stack',
    tagline: 'Watch the stack grow, then unwind.',
    description:
      'Step through factorial and naive Fibonacci calls. Every recursive call pushes a frame; every base case pops it and hands a value back up.',
    topic: 'Recursion',
    category: 'Linear',
    level: 'Beginner',
    duration: '8 min',
    covers: ['Call stack', 'Base case', 'Factorial', 'Fibonacci'],
    accent: 'amber',
  },
  {
    slug: 'dp',
    title: 'Dynamic programming tables',
    tagline: 'Fill the table once, read the answer twice.',
    description:
      'Build the climbing-stairs table and a full 0/1 knapsack grid. Each cell shows the smaller subproblem it depends on before it takes its value.',
    topic: 'Dynamic programming',
    category: 'Graphs & DP',
    level: 'Advanced',
    duration: '12 min',
    covers: ['Climbing stairs', '0/1 knapsack', 'Memo table', 'Bottom-up'],
    accent: 'emerald',
  },
  {
    slug: 'hash',
    title: 'Hash table (chaining)',
    tagline: 'One hash, then a short walk.',
    description:
      'Insert, search and delete keys in a chained hash table. See the hash function pick a bucket and collisions extend the linked chain.',
    topic: 'Hashing',
    category: 'Arrays & Hashing',
    level: 'Intermediate',
    duration: '8 min',
    covers: ['Insert', 'Search', 'Delete', 'Collisions'],
    accent: 'teal',
  },
];

export function getVisualizer(slug: string): VisualizerMeta | undefined {
  return VISUALIZERS.find((v) => v.slug === slug);
}

export function isVisualizerSlug(slug: string): slug is VisualizerSlug {
  return VISUALIZERS.some((v) => v.slug === slug);
}
