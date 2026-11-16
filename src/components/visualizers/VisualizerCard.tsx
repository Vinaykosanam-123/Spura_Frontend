import Link from 'next/link';
import type { VisualizerMeta } from '@/lib/visualizers/catalog';
import VisualizerGlyph from '@/components/visualizers/VisualizerGlyph';

const ACCENT: Record<VisualizerMeta['accent'], string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  orange: 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  rose: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
  teal: 'bg-teal-500/15 text-teal-300 border border-teal-500/25',
};

export default function VisualizerCard({
  meta,
  compact = false,
  onSelect,
}: {
  meta: VisualizerMeta;
  compact?: boolean;
  onSelect?: (slug: VisualizerMeta['slug']) => void;
}) {
  const cardCls = `group flex flex-col rounded-2xl border border-white/10 bg-[#0F1319] text-left transition-all hover:-translate-y-0.5 hover:border-amber-500/40 ${
    compact ? 'p-4' : 'p-5'
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-xl ${ACCENT[meta.accent]}`}>
          <VisualizerGlyph slug={meta.slug} className="h-7 w-9" />
        </span>
        <span className="rounded-full border border-white/10 bg-[#161B24] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
          {meta.level}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-400/90">{meta.topic}</p>
      <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-white">{meta.title}</h3>
      {!compact && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{meta.tagline}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        {meta.covers.slice(0, compact ? 3 : 4).map((c) => (
          <span key={c} className="rounded-md border border-white/5 bg-[#161B24] px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4 text-[12px]">
        <span className="text-slate-400">{meta.duration}</span>
        <span className="font-semibold text-amber-400 group-hover:underline">Launch →</span>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(meta.slug)} className={cardCls}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/visualize?tab=${meta.slug}`} className={cardCls}>
      {content}
    </Link>
  );
}
