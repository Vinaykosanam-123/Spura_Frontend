'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import { recordActivity } from '@/lib/activity';
import { executeAndTrace } from '@/lib/trace/runner';
import { VISUAL_LANGUAGES, type TraceResult, type VisualLanguage } from '@/lib/trace/types';
import { StepDiagramViewer } from '@/components/diagrams/StepDiagramViewer';

type Sample = { id: string; stdin: string; expected: string };
type RunResult = {
  testCaseId: string;
  stdin: string;
  expected: string;
  stdout?: string;
  actual?: string;
  passed: boolean;
  verdict?: string;
  runtimeMs: number;
  stderr: string;
};
type Submission = {
  id: string;
  status: string;
  verdict?: string;
  score?: number;
  runtimeMs?: number;
  createdAt: string;
  questionTitle?: string;
};
type Analysis = {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  betterApproach: { title: string; timeComplexity: string; spaceComplexity: string; hint: string } | null;
};

export default function PracticePage() {
  const { questionId } = useParams<{ questionId: string }>();
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hints, setHints] = useState<Array<{ sequence: number; hint: string }>>([]);
  const [taggedCompanies, setTaggedCompanies] = useState<Array<{ slug: string; name: string; frequency: number }>>([]);
  const [revealedHints, setRevealedHints] = useState(0);
  const [error, setError] = useState('');
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [tracing, setTracing] = useState(false);
  const [traceNotice, setTraceNotice] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(650);
  const [showDiagram, setShowDiagram] = useState(false);
  const router = useRouter();
  const [pollTimeout, setPollTimeout] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const MAX_POLLS = 50;

  const passedCount = runResults.filter((r) => r.passed).length;
  const totalTraceSteps = traceResult?.steps?.length || 0;

  useEffect(() => {
    if (runResults.length > 0 || submission || analysis || tracing) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [runResults, submission, analysis, tracing]);

  useEffect(() => {
    if (isPlaying && totalTraceSteps > 0) {
      playTimerRef.current = setTimeout(() => {
        if (stepIndex < totalTraceSteps - 1) {
          setStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed);
    } else if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, stepIndex, totalTraceSteps, playbackSpeed]);

  useEffect(() => {
    api.questionDetail(questionId)
      .then((data) => {
        setQuestion(data.question);
        setSamples(data.samples ?? []);
      })
      .catch((e: unknown) => {
        if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
        setError(e instanceof Error ? e.message : 'Failed to load question');
      });
    api.bankQuestionDetail(questionId)
      .then((data) => {
        setHints(data.hints ?? []);
        setTaggedCompanies(data.companies ?? []);
      })
      .catch(() => {});
  }, [questionId, router]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (pollTimeout && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [pollTimeout]);

  const handleRun = useCallback(async () => {
    setError('');
    setRunResults([]);
    setRunning(true);
    try {
      let data = await api.runQuestion(questionId, { language, sourceCode: code });
      if ((data.status === 'pending' || data.status === 'running') && data.jobId) {
        const jobId = data.jobId;
        for (let attempt = 0; attempt < 25; attempt++) {
          await new Promise((r) => setTimeout(r, 500));
          data = await api.runJob(jobId);
          if (data.status === 'completed' || data.status === 'failed') break;
        }
      }
      if (data.status === 'pending' || data.status === 'running') {
        setError('Execution timed out while waiting for the compiler worker. Please ensure the worker is running and try again.');
      } else if (data.status === 'failed' && data.errorMessage) {
        setError(data.errorMessage);
      }
      setRunResults((data.results ?? []) as RunResult[]);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) { router.push('/login'); return; }
      setError(err?.code === 'QUESTION_UNAVAILABLE' ? 'Question not available (enrollment inactive or expired).' : err.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  }, [questionId, language, code, router]);

  const handleSubmit = useCallback(async () => {
    setError('');
    setSubmitting(true);
    setSubmission(null);
    try {
      const key = crypto.randomUUID();
      const data = await api.submitQuestion(questionId, { language, sourceCode: code }, key);
      const sub = data.submission as Submission;
      setSubmission(sub);

      if (pollRef.current) clearInterval(pollRef.current);
      pollCountRef.current = 0;
      setPollTimeout(false);
      pollRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        if (pollCountRef.current >= MAX_POLLS) {
          setPollTimeout(true);
          return;
        }
        try {
          const detail = await api.submissionDetail(sub.id);
          const s = detail.submission as Submission;
          setSubmission(s);
          const isTerminal =
            s.status === 'completed' || s.status === 'infra_failed' || s.status === 'failed';
          if (isTerminal) {
            if (s.status === 'completed' && s.verdict === 'accepted') recordActivity({ solves: 1 });
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch (e: unknown) {
          if ((e as ApiError)?.status === 401) {
            if (pollRef.current) clearInterval(pollRef.current);
            router.push('/login');
          }
          // otherwise keep polling
        }
      }, 2000);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) { router.push('/login'); return; }
      if (err?.code === 'VALIDATION_ERROR') setError('Idempotency-Key header is required.');
      else setError(err?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [questionId, language, code, router]);

  const handleAnalyze = useCallback(async () => {
    setError('');
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const data = await api.analyzeQuestion(questionId, { language, sourceCode: code });
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) { router.push('/login'); return; }
      if (err?.status === 503) setError('Complexity analyzer is not configured (missing LLM key).');
      else if (err?.status === 429) setError('Analysis rate limit reached — try again later.');
      else setError(err?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [questionId, language, code, router]);

  const handleAnimate = useCallback(async () => {
    setShowDiagram(true);
    setTraceNotice('');
    setTraceResult(null);
    setStepIndex(0);
    setIsPlaying(false);

    if (!code.trim()) {
      setTraceNotice('Write your solution in the editor above first, then click "Animate Diagram" to step through variables and data structures.');
      return;
    }
    if (!VISUAL_LANGUAGES.includes(language)) {
      setTraceNotice(`Step-by-step visualization supports Python, JavaScript, C++, and Java (got ${language}).`);
      return;
    }

    setTracing(true);
    try {
      const res = await executeAndTrace(language as VisualLanguage, code, samples[0]?.stdin ?? '', { trace: true });
      setTraceResult(res);
      recordActivity({ minutes: 1 });
      if (res.error && (!res.steps || res.steps.length === 0)) {
        setTraceNotice(res.error.message);
      } else if (!res.steps || res.steps.length === 0) {
        setTraceNotice('Execution finished with no traceable step events inside functions.');
      } else if (res.steps.length > 1) {
        setIsPlaying(true);
      }
    } catch (e: unknown) {
      setTraceNotice(e instanceof Error ? e.message : 'Diagram execution failed');
    } finally {
      setTracing(false);
    }
  }, [code, language, samples]);

  if (error && !question) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">Loading...</p>
      </main>
    );
  }

  const questionTitle = (question.title as string) ?? 'Question';
  const version = question.version as Record<string, unknown> | undefined;
  const statement =
    (question.statement as string) ||
    (version?.statement as string) ||
    (question.description as string) ||
    '';
  const constraints = (version?.constraintsText as string) ?? '';
  const timeLimit = (version?.timeLimitMs as number) ?? 2000;

  const resetTrace = () => {
    setTraceResult(null);
    setTraceNotice('');
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    resetTrace();
  };

  const clearCode = () => {
    setCode('');
    resetTrace();
  };

  return (
    <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">{questionTitle}</h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/coding?problem=${encodeURIComponent((question.slug as string) || questionId)}&title=${encodeURIComponent(questionTitle)}&lang=${encodeURIComponent(language)}&tab=diagram`}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>⚡</span>
              <span>Open Diagram Visualizer</span>
            </Link>
            <a href="/my/curriculum" className="shrink-0 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
              Back to curriculum
            </a>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {(() => {
            const d = ((question.difficulty as string) ?? '').toLowerCase();
            return (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d === 'easy' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' : d === 'medium' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'}`}>
                {d ? d.charAt(0).toUpperCase() + d.slice(1) : 'Unknown'}
              </span>
            );
          })()}
          {(question.topic as string) && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
              {(question.topic as string)}
            </span>
          )}
          <span className="text-xs text-stone-500 dark:text-stone-400">{timeLimit}ms</span>
        </div>
        {taggedCompanies.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Asked by companies">
            <span className="text-xs text-stone-500 dark:text-stone-400 mr-1">Asked by:</span>
            {taggedCompanies.map((c) => (
              <Link
                key={c.slug}
                href={`/bank/${c.slug}`}
                title={`Asked in ${Math.round(c.frequency)}% of ${c.name} reports`}
                className="text-xs font-medium px-2.5 py-1 rounded-full border border-stone-300 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(360px,5fr)_minmax(0,7fr)] items-start">
        <div className="space-y-4 min-w-0">
          <div className="card-calm rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Problem Statement</h2>
            {statement ? (
              <pre className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-sans leading-relaxed">{statement}</pre>
            ) : (
              <p className="text-sm text-stone-500">No statement published for this question yet.</p>
            )}
          </div>

          {constraints && (
            <div className="card-calm rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Constraints</h2>
              <pre className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-sans">{constraints}</pre>
            </div>
          )}

          {samples.length > 0 && (
            <div className="card-calm rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">Sample Test Cases</h2>
              <div className="space-y-3">
                {samples.map((s, i) => (
                  <div key={s.id} id={i === 0 ? 'sample-0' : undefined} className="text-sm scroll-mt-24">
                    <p className="text-stone-500">Input:</p>
                    <pre className="bg-stone-100 dark:bg-[#06080B] border border-transparent dark:border-white/10 rounded-lg p-2.5 mt-1 text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{s.stdin}</pre>
                    <p className="text-stone-500 mt-2">Expected Output:</p>
                    <pre className="bg-stone-100 dark:bg-[#06080B] border border-transparent dark:border-white/10 rounded-lg p-2.5 mt-1 text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{s.expected}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="space-y-4 min-w-0">
          <div className="card-calm rounded-2xl p-3 flex flex-wrap items-center gap-2 sm:gap-3 lg:sticky lg:top-[72px] z-10 bg-[#faf9f7]/95 dark:bg-[#0F1319]/95 backdrop-blur">
            <label htmlFor="language" className="text-sm font-medium text-stone-700 dark:text-stone-300 ml-1">Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button
              type="button"
              onClick={clearCode}
              className="text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-white/10 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-white/5"
            >
              Clear
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleAnimate}
              disabled={running || submitting || tracing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/12 hover:bg-amber-500 hover:text-stone-950 px-4 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-50"
            >
              <span aria-hidden>{tracing ? '⏳' : '⚡'}</span>
              {tracing ? 'Tracing…' : 'Animate Diagram'}
            </button>
            <button
              onClick={handleRun}
              disabled={running || submitting || !code.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-50"
            >
              <span aria-hidden>{running ? '⏳' : '▶'}</span>
              {running ? 'Running…' : 'Run Samples'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={running || submitting || !code.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm font-semibold text-stone-950 transition-colors disabled:opacity-50"
            >
              <span aria-hidden>✓</span>
              {submitting
                ? 'Submitting…'
                : submission &&
                    submission.status !== 'completed' &&
                    submission.status !== 'infra_failed' &&
                    submission.status !== 'failed'
                  ? 'Judging…'
                  : 'Submit'}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={running || submitting || analyzing || !code.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-50"
            >
              <span aria-hidden>{analyzing ? '⏳' : '◔'}</span>
              {analyzing ? 'Analyzing…' : 'Complexity'}
            </button>
          </div>

          <div className="card-calm rounded-2xl overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Write your ${language} solution here...`}
              className="w-full h-[55vh] min-h-[420px] p-4 bg-stone-50 dark:bg-[#06080B] text-stone-900 dark:text-stone-100 font-mono text-sm resize-y focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Input is fed via stdin exactly as shown in samples — match your parsing to it.
            {samples.length > 0 && (
              <> <a href="#sample-0" className="underline underline-offset-2 hover:text-stone-900 dark:hover:text-white">See first sample input</a>.</>
            )}
          </p>

          {error && (
            <div className="p-3 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
              {error}
            </div>
          )}

          <div ref={resultRef} className="scroll-mt-24 space-y-4">
            {(showDiagram || tracing) && (
              <div className="card-calm rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-amber-500 text-sm" aria-hidden>⚡</span>
                    <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                      Visual Diagram &amp; Execution Tracer
                    </h2>
                    {traceResult?.steps?.[stepIndex] && (() => {
                      const activeLineNum = traceResult.steps[stepIndex].line;
                      const activeLineText = code.split('\n')[activeLineNum - 1]?.trim();
                      return (
                        <span className="hidden sm:inline-block truncate max-w-[340px] text-xs font-mono px-2 py-0.5 rounded bg-stone-200/80 dark:bg-white/[0.06] text-stone-700 dark:text-stone-300">
                          L{activeLineNum}{activeLineText ? `: ${activeLineText}` : ''}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setShowDiagram(false);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white px-2 py-1 rounded"
                  >
                    Hide
                  </button>
                </div>
                <StepDiagramViewer
                  traceResult={traceResult}
                  isTracing={tracing}
                  diagramNotice={traceNotice}
                  currentStepIndex={stepIndex}
                  onStepChange={setStepIndex}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                  playbackSpeed={playbackSpeed}
                  onPlaybackSpeedChange={setPlaybackSpeed}
                />
              </div>
            )}

            {submission && (
              <div className="card-calm rounded-2xl p-5 border border-stone-300 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                      submission.status !== 'completed' &&
                      submission.status !== 'infra_failed' &&
                      submission.status !== 'failed'
                        ? 'animate-pulse bg-amber-500 text-stone-950'
                        : submission.verdict === 'accepted'
                          ? 'bg-emerald-500 text-stone-950'
                          : 'bg-rose-500 text-white'
                    }`}
                    aria-hidden
                  >
                    {submission.status !== 'completed' &&
                    submission.status !== 'infra_failed' &&
                    submission.status !== 'failed'
                      ? '…'
                      : submission.verdict === 'accepted'
                        ? '✓'
                        : '✗'}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-stone-900 dark:text-stone-50">
                      {submission.status === 'infra_failed' || submission.status === 'failed'
                        ? 'Execution unavailable — please resubmit'
                        : submission.status !== 'completed'
                          ? 'Judging your solution…'
                          : submission.verdict === 'accepted'
                            ? 'Accepted'
                            : `Not accepted: ${submission.verdict}`}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Status: {submission.status}
                      {submission.verdict && <> · Verdict: {submission.verdict}</>}
                      {typeof submission.runtimeMs === 'number' && <> · {submission.runtimeMs}ms</>}
                      {typeof submission.score === 'number' && <> · Score: {submission.score}</>}
                    </p>
                  </div>
                </div>
                {pollTimeout &&
                  submission.status !== 'completed' &&
                  submission.status !== 'infra_failed' &&
                  submission.status !== 'failed' && (
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      Taking longer than usual — keep waiting or resubmit.
                    </p>
                  )}
              </div>
            )}

            {analysis && (
              <div className="card-calm rounded-2xl p-5 border border-stone-200 dark:border-white/10">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">Complexity Analysis</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500 text-stone-950">
                    Time: {analysis.timeComplexity}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200">
                    Space: {analysis.spaceComplexity}
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{analysis.explanation}</p>
                {analysis.betterApproach && (
                  <div className="mt-4 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-[#06080B] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Better approach exists
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
                      {analysis.betterApproach.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-stone-950">
                        Time: {analysis.betterApproach.timeComplexity}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200">
                        Space: {analysis.betterApproach.spaceComplexity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{analysis.betterApproach.hint}</p>
                  </div>
                )}
              </div>
            )}

            {hints.length > 0 && (
              <div className="card-calm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Hints</h2>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{revealedHints}/{hints.length} revealed</span>
                </div>
                <div className="space-y-2">
                  {hints.slice(0, revealedHints).map((h) => (
                    <p key={h.sequence} className="text-sm p-3 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-[#06080B] text-stone-700 dark:text-stone-300 leading-relaxed">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Hint {h.sequence}: </span>{h.hint}
                    </p>
                  ))}
                  {revealedHints < hints.length && (
                    <button
                      onClick={() => setRevealedHints((n) => n + 1)}
                      className="text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-white/10 rounded-xl px-3 py-1.5"
                    >
                      Reveal hint {revealedHints + 1} →
                    </button>
                  )}
                </div>
              </div>
            )}

            {runResults.length > 0 && (
              <div className="card-calm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Sample Results</h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200">
                    {passedCount}/{runResults.length} passed
                  </span>
                </div>
                <div className="space-y-2">
                  {runResults.map((r, i) => (
                    <div key={r.testCaseId} className="text-sm p-3 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-[#06080B]">
                      <p className={`font-semibold text-xs uppercase tracking-wide ${r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {r.passed ? '✓' : '✗'} Sample {i + 1} · {r.passed ? 'Passed' : (r.verdict ?? 'Failed')} · {r.runtimeMs ?? 0}ms
                      </p>
                      {!r.passed && (
                        <pre className="text-xs mt-1.5 text-stone-600 dark:text-stone-400 whitespace-pre-wrap font-mono">Expected: {r.expected}{'\n'}Got: {r.stderr || r.stdout || r.actual || '(empty output)'}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
