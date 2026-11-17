"use client";

import React from "react";
import type { TraceResult, TraceStep } from "@/lib/trace/types";
import {
  extractArraysWithPointers,
  extractLinkedLists,
  extractBinaryTrees,
  extractStacks,
  extractDictsAndSets,
  extractFrameWatches,
} from "@/lib/trace/diagram-parser";
import { LinkedListDiagram } from "@/components/diagrams/LinkedListDiagram";
import { ArrayPointersDiagram } from "@/components/diagrams/ArrayPointersDiagram";
import { BinaryTreeDiagram } from "@/components/diagrams/BinaryTreeDiagram";
import { StackQueueDiagram } from "@/components/diagrams/StackQueueDiagram";

interface StepDiagramViewerProps {
  traceResult: TraceResult | null;
  isTracing: boolean;
  diagramNotice: string;
  currentStepIndex: number;
  onStepChange: (nextIndex: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (ms: number) => void;
  fillHeight?: boolean;
}

const SPEED_OPTIONS = [
  { label: "0.5x", ms: 1100 },
  { label: "1x", ms: 650 },
  { label: "2x", ms: 300 },
] as const;

export function StepDiagramViewer({
  traceResult,
  isTracing,
  diagramNotice,
  currentStepIndex,
  onStepChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onPlaybackSpeedChange,
  fillHeight = false,
}: StepDiagramViewerProps) {
  const totalSteps = traceResult?.steps?.length || 0;
  const clampedIdx = totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;
  const currentStep: TraceStep | undefined = traceResult?.steps?.[clampedIdx];
  const heap = currentStep?.heap || {};
  const linkedLists = currentStep ? extractLinkedLists(currentStep, heap) : [];
  const arrays = currentStep ? extractArraysWithPointers(currentStep, heap) : [];
  const trees = currentStep ? extractBinaryTrees(currentStep, heap) : [];
  const stacks = currentStep ? extractStacks(currentStep, heap) : [];
  const dictsAndSets = currentStep ? extractDictsAndSets(currentStep, heap) : [];
  const frameWatches = currentStep ? extractFrameWatches(currentStep, heap) : [];

  return (
    <div className={fillHeight ? "flex-1 flex flex-col overflow-hidden" : "flex flex-col overflow-hidden"}>
      <div className={fillHeight ? "flex-1 overflow-y-auto p-5" : "max-h-[460px] overflow-y-auto p-4 sm:p-5"}>
        {isTracing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-600 dark:text-stone-400">
            <div className="w-7 h-7 rounded-full border-2 border-amber-500/25 border-t-amber-500 animate-spin" />
            <span className="text-sm">Executing code &amp; building diagram...</span>
          </div>
        ) : !traceResult || totalSteps === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3 text-stone-500 dark:text-stone-400">
            <div className="text-2xl text-amber-500" aria-hidden>✦</div>
            <div className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              {diagramNotice ? "Trace Diagnostic" : "Interactive Diagram Ready"}
            </div>
            <p className={`text-xs sm:text-sm max-w-md leading-relaxed ${diagramNotice ? "text-amber-700 dark:text-amber-300" : "text-stone-500 dark:text-stone-400"}`}>
              {diagramNotice ||
                'Click "Animate Diagram" to trace Python 3, JavaScript, C++ 20, or Java 21—including your own custom code—line by line.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {linkedLists.length > 0 && <LinkedListDiagram lists={linkedLists} />}
            {trees.length > 0 && <BinaryTreeDiagram trees={trees} />}
            {stacks.length > 0 && <StackQueueDiagram stacks={stacks} />}
            {arrays.length > 0 && <ArrayPointersDiagram arrays={arrays} />}

            {dictsAndSets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dictsAndSets.map((ds) => (
                  <div
                    key={ds.name}
                    className="p-3 rounded-xl bg-stone-100/80 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10"
                  >
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 font-mono">
                      {ds.kind === "dict" ? "Map / Dict" : "Set"} · {ds.name}
                    </div>
                    {ds.kind === "dict" ? (
                      ds.entries.length === 0 ? (
                        <span className="text-xs text-stone-500 dark:text-stone-400">empty</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ds.entries.map((e, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-500/12 border border-amber-500/25 text-stone-900 dark:text-stone-100"
                            >
                              {e.key} → {e.value}
                            </span>
                          ))}
                        </div>
                      )
                    ) : ds.items.length === 0 ? (
                      <span className="text-xs text-stone-500 dark:text-stone-400">empty</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {ds.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/12 border border-emerald-500/25 text-stone-900 dark:text-stone-100"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {frameWatches.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                  Call Stack &amp; Live Variables (Line {currentStep?.line})
                </div>
                <div className="flex flex-col gap-2">
                  {frameWatches.map((fr, fIdx) => (
                    <div
                      key={`${fr.name}-${fIdx}`}
                      className="px-2.5 py-2 rounded-lg bg-white dark:bg-[#06080B] border border-stone-200 dark:border-white/10"
                    >
                      <div className={`text-xs font-bold text-stone-900 dark:text-stone-100 font-mono ${fr.vars.length > 0 ? "mb-1.5" : ""}`}>
                        {fr.name}() <span className="text-stone-500 dark:text-stone-400 font-medium">· line {fr.line}</span>
                      </div>
                      {fr.vars.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {fr.vars.map((v, vIdx) => (
                            <span
                              key={`${v.name}-${vIdx}`}
                              className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300"
                            >
                              <strong className="text-amber-700 dark:text-amber-400">{v.name}</strong> = {v.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep?.stdout && (
              <div className="px-3 py-2.5 rounded-lg bg-stone-100 dark:bg-[#06080B] border border-stone-200 dark:border-white/10 font-mono text-xs text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">
                <span className="text-stone-500 dark:text-stone-400 font-bold">stdout: </span>
                {currentStep.stdout}
              </div>
            )}
          </div>
        )}
      </div>

      {totalSteps > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-stone-100 dark:bg-[#06080B] border-t border-stone-200 dark:border-white/10">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStepChange(0)}
              disabled={clampedIdx === 0}
              title="First Step"
              className="px-1.5 py-1 rounded bg-stone-200/80 dark:bg-white/[0.06] text-xs font-semibold text-stone-900 dark:text-stone-100 disabled:text-stone-400 dark:disabled:text-stone-600"
            >
              |◀
            </button>
            <button
              type="button"
              onClick={() => onStepChange((p) => Math.max(0, p - 1))}
              disabled={clampedIdx === 0}
              title="Previous Step"
              className="px-2 py-1 rounded bg-stone-200/80 dark:bg-white/[0.06] text-xs font-semibold text-stone-900 dark:text-stone-100 disabled:text-stone-400 dark:disabled:text-stone-600"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => onStepChange((p) => Math.min(totalSteps - 1, p + 1))}
              disabled={clampedIdx >= totalSteps - 1}
              title="Next Step"
              className="px-2 py-1 rounded bg-stone-200/80 dark:bg-white/[0.06] text-xs font-semibold text-stone-900 dark:text-stone-100 disabled:text-stone-400 dark:disabled:text-stone-600"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => onStepChange(totalSteps - 1)}
              disabled={clampedIdx >= totalSteps - 1}
              title="Last Step"
              className="px-1.5 py-1 rounded bg-stone-200/80 dark:bg-white/[0.06] text-xs font-semibold text-stone-900 dark:text-stone-100 disabled:text-stone-400 dark:disabled:text-stone-600"
            >
              ▶|
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[240px]">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={clampedIdx}
              onChange={(e) => onStepChange(Number(e.target.value))}
              aria-label="Execution step"
              className="flex-1 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs text-stone-600 dark:text-stone-400 min-w-[48px] text-right tabular-nums">
              {clampedIdx + 1}/{totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => onPlaybackSpeedChange(opt.ms)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  playbackSpeed === opt.ms
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {currentStep && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold tabular-nums">
              Line {currentStep.line}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
