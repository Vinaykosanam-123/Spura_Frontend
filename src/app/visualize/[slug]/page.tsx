import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVisualizer } from '@/lib/visualizers/catalog';
import VisualizerStudio from '@/components/visualizers/VisualizerStudio';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getVisualizer(slug);
  if (!meta) return { title: 'Visualizer not found | SPURA' };
  return {
    title: `${meta.title} Visualizer | SPURA`,
    description: meta.description,
  };
}

export default async function VisualizerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getVisualizer(slug);
  if (!meta) notFound();

  return <VisualizerStudio initialSlug={meta.slug} />;
}
