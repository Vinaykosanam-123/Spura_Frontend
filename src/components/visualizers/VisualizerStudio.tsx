'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  VISUALIZERS,
  getVisualizer,
  type VisualizerCategory,
  type VisualizerSlug,
} from '@/lib/visualizers/catalog';
import VisualizerGlyph from '@/components/visualizers/VisualizerGlyph';
import SortingVisualizer from '@/components/visualizers/SortingVisualizer';
import StackQueueVisualizer from '@/components/visualizers/StackQueueVisualizer';
import LinkedListVisualizer from '@/components/visualizers/LinkedListVisualizer';
import BstVisualizer from '@/components/visualizers/BstVisualizer';
import GraphVisualizer from '@/components/visualizers/GraphVisualizer';
import HeapVisualizer from '@/components/visualizers/HeapVisualizer';
import AvlVisualizer from '@/components/visualizers/AvlVisualizer';
import TrieVisualizer from '@/components/visualizers/TrieVisualizer';
import RecursionVisualizer from '@/components/visualizers/RecursionVisualizer';
import DpVisualizer from '@/components/visualizers/DpVisualizer';
import HashTableVisualizer from '@/components/visualizers/HashTableVisualizer';

const CATEGORIES: VisualizerCategory[] = [
  'All',
  'Arrays & Hashing',
  'Linear',
  'Trees & Tries',
  'Graphs & DP',
];

function VisualizerStage({ slug }: { slug: VisualizerSlug }) {
  switch (slug) {
    case 'sorting':
      return <SortingVisualizer />;
    case 'stack-queue':
      return <StackQueueVisualizer />;
    case 'linked-list':
      return <LinkedListVisualizer />;
    case 'bst':
      return <BstVisualizer />;
    case 'graph':
      return <GraphVisualizer />;
    case 'heap':
      return <HeapVisualizer />;
    case 'avl':
      return <AvlVisualizer />;
    case 'trie':
      return <TrieVisualizer />;
    case 'recursion':
      return <RecursionVisualizer />;
    case 'dp':
      return <DpVisualizer />;
    case 'hash':
      return <HashTableVisualizer />;
  }
}

export default function VisualizerStudio({
  initialSlug = 'sorting',
}: {
  initialSlug?: VisualizerSlug;
}) {
  const [activeSlug, setActiveSlug] = useState<VisualizerSlug>(initialSlug);
  const [prevInitialSlug, setPrevInitialSlug] = useState<VisualizerSlug>(initialSlug);
  const [category, setCategory] = useState<VisualizerCategory>('All');

  if (prevInitialSlug !== initialSlug) {
    setPrevInitialSlug(initialSlug);
    setActiveSlug(initialSlug);
  }

  const activeMeta = getVisualizer(activeSlug) ?? VISUALIZERS[0];
  const visibleVisualizers =
    category === 'All'
      ? VISUALIZERS
      : VISUALIZERS.filter((v) => v.category === category);

  const selectVisualizer = (slug: VisualizerSlug) => {
    setActiveSlug(slug);
    if (typeof window !== 'undefined') {
      const url = `/visualize?tab=${slug}`;
      window.history.replaceState(null, '', url);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Unified Studio Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400">
            Interactive DSA Visualizers · {VISUALIZERS.length} Live Labs
          </div>
          <h1 className="mt-2.5 text-[28px] font-bold tracking-tight text-stone-900 dark:text-white sm:text-[34px]">
            Algorithm &amp; Data Structure Studio
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] text-stone-600 dark:text-slate-400">
            Switch across all {VISUALIZERS.length} visualizers right here—Sorting, Stacks, Linked Lists, BST, Graphs,
            Heaps, AVL Rotations, Tries, Recursion, DP Tables, and Hashing—step-by-step on one screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/coding"
            className="inline-flex h-9 items-center rounded-xl border border-amber-500/30 bg-amber-500/15 px-3.5 text-[13px] font-semibold text-amber-600 dark:text-amber-300 transition-colors hover:bg-amber-500 hover:text-stone-950"
          >
            Open Code Compiler →
          </Link>
          <Link
            href="/bank"
            className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-[#0F1319] px-3.5 text-[13px] font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:text-amber-500 dark:hover:text-white"
          >
            450+ Sheet
          </Link>
        </div>
      </div>

      {/* Category Filter Row */}
      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter visualizers by category">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const count =
            cat === 'All'
              ? VISUALIZERS.length
              : VISUALIZERS.filter((v) => v.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`h-8 rounded-full border px-3.5 text-[12px] transition-colors ${
                active
                  ? 'border-amber-500 bg-amber-500 font-semibold text-stone-950'
                  : 'border-white/10 bg-[#0F1319] font-medium text-slate-300 hover:border-amber-500/40 hover:text-white'
              }`}
            >
              {cat} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* All 11 Visualizers In-Place Switcher Grid */}
      <div
        className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        role="tablist"
        aria-label="Select data structure or algorithm visualizer"
      >
        {visibleVisualizers.map((item) => {
          const isSelected = item.slug === activeSlug;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => selectVisualizer(item.slug)}
              className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/12 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-[#0F1319] hover:border-amber-500/40 hover:bg-[#161B24]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-8 w-9 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-[#161B24] text-amber-400 group-hover:text-amber-300'
                  }`}
                >
                  <VisualizerGlyph slug={item.slug} className="h-5 w-6" />
                </span>
                <span className="text-[10px] font-medium text-slate-400">{item.level}</span>
              </div>
              <div className="mt-2.5">
                <div
                  className={`text-[13px] font-semibold leading-tight ${
                    isSelected ? 'text-amber-600 dark:text-amber-300' : 'text-stone-900 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500 dark:text-slate-400 truncate">{item.topic}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Visualizer Detail + Live Stage */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0F1319]/60 p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-amber-600 dark:text-amber-300">
                {activeMeta.topic}
              </span>
              <span className="rounded-full border border-white/10 bg-[#161B24] px-2.5 py-0.5 text-slate-300">
                {activeMeta.level}
              </span>
              <span className="rounded-full border border-white/10 bg-[#161B24] px-2.5 py-0.5 text-slate-300">
                {activeMeta.duration}
              </span>
            </div>
            <h2 className="mt-2 text-[22px] font-bold tracking-tight text-stone-900 dark:text-white">
              {activeMeta.title}
            </h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-stone-600 dark:text-slate-400">
              {activeMeta.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:max-w-[260px] sm:justify-end">
            {activeMeta.covers.map((c) => (
              <span
                key={c}
                className="rounded-md border border-white/10 bg-[#161B24] px-2 py-0.5 text-[11px] font-medium text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <VisualizerStage key={activeMeta.slug} slug={activeMeta.slug} />
      </section>
    </main>
  );
}
