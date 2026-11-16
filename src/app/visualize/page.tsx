import type { Metadata } from 'next';
import { isVisualizerSlug, type VisualizerSlug } from '@/lib/visualizers/catalog';
import VisualizerStudio from '@/components/visualizers/VisualizerStudio';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DSA Visualizers — See algorithms move | SPURA',
  description:
    'Interactive visualizers for sorting, stacks, queues, linked lists, binary search trees, heaps, AVL rotations, tries, recursion, dynamic programming, hashing and graph traversal.',
};

export default async function VisualizeHub({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialSlug: VisualizerSlug = tab && isVisualizerSlug(tab) ? tab : 'sorting';

  return <VisualizerStudio initialSlug={initialSlug} />;
}
