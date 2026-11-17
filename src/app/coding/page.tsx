"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CURATED_PROBLEMS, type DiagramType, type Problem } from "@/lib/problems";
import { executeAndTrace } from "@/lib/trace/runner";
import type { TraceResult, TraceStep } from "@/lib/trace/types";
import { recordActivity } from "@/lib/activity";
import {
  extractArraysWithPointers,
  extractLinkedLists,
  extractBinaryTrees,
  extractStacks,
} from "@/lib/trace/diagram-parser";
import { LinkedListDiagram } from "@/components/diagrams/LinkedListDiagram";
import { ArrayPointersDiagram } from "@/components/diagrams/ArrayPointersDiagram";
import { BinaryTreeDiagram } from "@/components/diagrams/BinaryTreeDiagram";
import { StackQueueDiagram } from "@/components/diagrams/StackQueueDiagram";

type EditorLanguage = "python" | "javascript" | "cpp" | "java";

interface MonacoEditorHandle {
  deltaDecorations: (
    oldDecorations: string[],
    newDecorations: Array<{
      range: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      };
      options: {
        isWholeLine: boolean;
        className: string;
      };
    }>
  ) => string[];
  revealLineInCenterIfOutsideViewport: (lineNumber: number) => void;
}

interface RunHistoryItem {
  id: number;
  timeLabel: string;
  problemTitle: string;
  language: EditorLanguage;
  verdict: string;
  stepsCount: number;
  durationMs: number | null;
}

interface DbSubmissionItem {
  id: string;
  questionTitle?: string;
  questionSlug?: string;
  language: string;
  status: string;
  verdict: string | null;
  score: number | null;
  runtimeMs: number | null;
  createdAt: string;
}

function inferDiagramType(topic: string): DiagramType {
  const t = (topic || "").toLowerCase();
  if (t.includes("linked")) return "linked_list";
  if (t.includes("tree") || t.includes("bst") || t.includes("trie") || t.includes("heap")) return "binary_tree";
  if (t.includes("stack") || t.includes("queue")) return "stack";
  if (t.includes("graph")) return "graph";
  return "array_pointers";
}

function formatTopicLabel(topic: string): string {
  if (!topic) return "Arrays & Hashing";
  return topic
    .split(/[-_\s]+/)
    .map((w) => (w.toLowerCase() === "dp" ? "DP" : w.toLowerCase() === "bst" ? "BST" : w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function buildDefaultTemplates(title: string): Problem["templates"] {
  return {
    python: `import sys\n\n# ${title}\ndef solve():\n    lines = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]\n    if not lines:\n        return\n    # Write your solution below\n    print(lines[0])\n\nif __name__ == "__main__":\n    solve()\n`,
    javascript: `const fs = require("fs");\n\n// ${title}\nfunction solve() {\n  const lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/).filter(Boolean);\n  if (lines.length === 0) return;\n  // Write your solution below\n  console.log(lines[0]);\n}\n\nsolve();\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n// ${title}\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string line;\n    if (getline(cin, line)) {\n        cout << line << "\\n";\n    }\n    return 0;\n}\n`,
    java: `import java.util.*;\n\n// ${title}\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            System.out.println(sc.nextLine());\n        }\n        sc.close();\n    }\n}\n`,
  };
}

// Dynamic Monaco editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        backgroundColor: "var(--bg-code)",
        color: "var(--text-muted)",
        fontFamily: "monospace",
        fontSize: "0.85rem",
      }}
    >
      Loading code editor...
    </div>
  ),
});

function CodingWorkspace({
  initialSlug,
  initialTab,
}: {
  initialSlug: string | null;
  initialTab: string | null;
}) {
  const [problemsList, setProblemsList] = useState<Problem[]>(CURATED_PROBLEMS);
  const [selectedProblem, setSelectedProblem] = useState<Problem>(() => {
    if (initialSlug) {
      const found = CURATED_PROBLEMS.find((p) => p.slug === initialSlug || p.id === initialSlug);
      if (found) return found;
    }
    return CURATED_PROBLEMS[0];
  });
  const [language, setLanguage] = useState<EditorLanguage>("python");
  const [code, setCode] = useState<string>(() => selectedProblem.templates.python);
  const [stdin, setStdin] = useState<string>(() => selectedProblem.defaultStdin);
  const [showProblemList, setShowProblemList] = useState(false);
  const [problemSearch, setProblemSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  const [dbSubmissions, setDbSubmissions] = useState<DbSubmissionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentProblemIndex = problemsList.findIndex((p) => p.id === selectedProblem.id || p.slug === selectedProblem.slug);
  const problemTopics = ["All", ...Array.from(new Set(problemsList.map((p) => p.topic)))];
  const filteredProblems = problemsList.filter((p) => {
    if (difficultyFilter !== "All" && p.difficulty !== difficultyFilter) return false;
    if (topicFilter !== "All" && p.topic !== topicFilter) return false;
    const q = problemSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.topic.toLowerCase().includes(q) ||
      p.companies.some((c) => c.toLowerCase().includes(q))
    );
  });

  const stepAdjacentProblem = (delta: number) => {
    const idx = currentProblemIndex >= 0 ? currentProblemIndex : 0;
    const nextIdx = (idx + delta + problemsList.length) % problemsList.length;
    handleProblemChange(problemsList[nextIdx]);
  };

  // Left Pane Active Tab: "description" | "diagram" | "submissions"
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "diagram" | "submissions">(() =>
    initialTab === "diagram" ? "diagram" : "description"
  );

  // Trace & Diagram State
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [diagramNotice, setDiagramNotice] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(650);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Console / Output state
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("result");
  const [outputStdout, setOutputStdout] = useState<string>("");
  const [outputStderr, setOutputStderr] = useState<string>("");
  const [runVerdict, setRunVerdict] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  // Editor ref
  const editorRef = useRef<MonacoEditorHandle | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Hydrate full problem statement/samples from PostgreSQL if not yet loaded
  const hydrateProblemFromDb = async (prob: Problem) => {
    if (prob.description && prob.description !== "Loading problem statement from SPURA database...") {
      return;
    }
    try {
      const lookupKey = prob.dbId || prob.slug || prob.id;
      const res = await fetch(`/api/v1/me/bank/questions/${encodeURIComponent(lookupKey)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const q = data.question;
      if (!q) return;
      const samples: Array<{ stdin: string; expected: string }> = Array.isArray(data.samples) ? data.samples : [];
      const companies: Array<{ name: string }> = Array.isArray(data.companies) ? data.companies : [];
      const hydrated: Problem = {
        ...prob,
        dbId: q.id,
        slug: q.slug || prob.slug,
        title: q.title || prob.title,
        description: q.statement || prob.description,
        examples: samples.map((s) => ({ input: s.stdin, output: s.expected })),
        constraints: q.constraints
          ? String(q.constraints)
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
              .filter(Boolean)
          : prob.constraints,
        companies: companies.length > 0 ? companies.map((c) => c.name) : prob.companies,
        defaultStdin: samples[0]?.stdin ?? prob.defaultStdin,
      };
      setProblemsList((prev) => prev.map((item) => (item.slug === hydrated.slug || item.id === hydrated.id ? hydrated : item)));
      setSelectedProblem((curr) => {
        if (curr.slug === hydrated.slug || curr.id === hydrated.id) {
          setStdin((prevStdin) => (prevStdin ? prevStdin : hydrated.defaultStdin));
          return hydrated;
        }
        return curr;
      });
    } catch {
      // Keep local fallback
    }
  };

  // Load 487+ database questions and persisted user submissions from PostgreSQL
  useEffect(() => {
    let cancelled = false;
    async function loadFromDatabase() {
      try {
        const [bankRes, subRes] = await Promise.all([
          fetch("/api/v1/me/bank/questions?limit=500", { credentials: "include" }),
          fetch("/api/v1/me/submissions", { credentials: "include" }),
        ]);

        if (!cancelled && subRes.ok) {
          const subData = await subRes.json();
          if (Array.isArray(subData.submissions)) {
            setDbSubmissions(subData.submissions);
          }
        }

        if (!cancelled && bankRes.ok) {
          const bankData = await bankRes.json();
          const dbQuestions: Array<{
            id: string;
            slug: string;
            title: string;
            topic: string;
            difficulty: string;
            acceptance?: number | string | null;
            companies?: Array<{ slug: string; name: string }>;
          }> = Array.isArray(bankData.questions) ? bankData.questions : [];

          if (dbQuestions.length > 0) {
            const bySlug = new Map(dbQuestions.map((q) => [q.slug, q]));
            const merged: Problem[] = CURATED_PROBLEMS.map((cur) => {
              const match = bySlug.get(cur.slug);
              if (!match) return cur;
              bySlug.delete(cur.slug);
              return {
                ...cur,
                dbId: match.id,
                companies:
                  cur.companies.length > 0
                    ? cur.companies
                    : (match.companies || []).map((c) => c.name),
              };
            });

            for (const dbQ of bySlug.values()) {
              const capDiff: "Easy" | "Medium" | "Hard" =
                dbQ.difficulty === "hard" ? "Hard" : dbQ.difficulty === "medium" ? "Medium" : "Easy";
              merged.push({
                id: dbQ.id,
                dbId: dbQ.id,
                slug: dbQ.slug,
                title: dbQ.title,
                difficulty: capDiff,
                topic: formatTopicLabel(dbQ.topic),
                acceptance: dbQ.acceptance != null ? `${dbQ.acceptance}%` : "52.0%",
                companies: (dbQ.companies || []).map((c) => c.name),
                diagramType: inferDiagramType(dbQ.topic),
                description: "Loading problem statement from SPURA database...",
                examples: [],
                constraints: [],
                templates: buildDefaultTemplates(dbQ.title),
                defaultStdin: "",
              });
            }

            setProblemsList(merged);
            if (initialSlug) {
              const target = merged.find((p) => p.slug === initialSlug || p.id === initialSlug || p.dbId === initialSlug);
              if (target) {
                setSelectedProblem(target);
                setCode(target.templates.python);
                setStdin(target.defaultStdin);
                void hydrateProblemFromDb(target);
              }
            } else if (merged[0]?.dbId) {
              setSelectedProblem((curr) => (curr.slug === merged[0].slug ? { ...curr, dbId: merged[0].dbId } : curr));
            }
          }
        }
      } catch {
        // Offline / unauthenticated fallback uses CURATED_PROBLEMS
      }
    }
    void loadFromDatabase();
    return () => {
      cancelled = true;
    };
  }, [initialSlug]);

  // When problem changes
  const handleProblemChange = (prob: Problem) => {
    setSelectedProblem(prob);
    setCode(prob.templates[language]);
    setStdin(prob.defaultStdin);
    setTraceResult(null);
    setDiagramNotice("");
    setCurrentStepIndex(0);
    setOutputStdout("");
    setOutputStderr("");
    setRunVerdict(null);
    setActiveLeftTab("description");
    void hydrateProblemFromDb(prob);
    if (typeof window !== "undefined") {
      const nextUrl = `/coding?problem=${encodeURIComponent(prob.slug)}`;
      window.history.replaceState(null, "", nextUrl);
    }
  };

  // When language changes
  const handleLanguageChange = (lang: EditorLanguage) => {
    setLanguage(lang);
    setCode(selectedProblem.templates[lang]);
    setTraceResult(null);
    setDiagramNotice("");
    setCurrentStepIndex(0);
  };

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor as MonacoEditorHandle;
  };

  // Playback timer loop
  const totalSteps = traceResult?.steps?.length || 0;
  useEffect(() => {
    if (isPlaying && totalSteps > 0) {
      playTimerRef.current = setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed);
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed]);

  // Synchronize line highlight in Monaco editor with current diagram step
  useEffect(() => {
    if (!editorRef.current || !traceResult || traceResult.steps.length === 0) {
      if (editorRef.current && decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const step = traceResult.steps[currentStepIndex];
    if (!step || !step.line) return;

    const line = step.line;
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1000,
        },
        options: {
          isWholeLine: true,
          className: "editor-highlight-line",
        },
      },
    ]);

    editorRef.current.revealLineInCenterIfOutsideViewport(line);
  }, [traceResult, currentStepIndex]);

  // Run and Animate Diagram: Executes code and immediately focuses Diagram tab!
  const recordRun = (lang: EditorLanguage, verdict: string, stepsCount: number, durationMs: number | null) => {
    setRunHistory((prev) => [
      {
        id: Date.now(),
        timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        problemTitle: selectedProblem.title,
        language: lang,
        verdict,
        stepsCount,
        durationMs,
      },
      ...prev.slice(0, 19),
    ]);
  };

  const runTraceForLanguage = async (lang: "python" | "javascript", source: string) => {
    setDiagramNotice("");
    setIsTracing(true);
    setIsRunning(true);
    setActiveLeftTab("diagram");
    const startTime = performance.now();

    try {
      const res = await executeAndTrace(lang, source, stdin, { trace: true });
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);
      setTraceResult(res);
      setCurrentStepIndex(0);
      setOutputStdout(res.stdout);
      const verdict = res.error ? "Runtime Error" : "Accepted";
      setOutputStderr(res.error ? res.error.message : "");
      setRunVerdict(verdict);
      recordRun(lang, verdict, res.steps?.length || 0, elapsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutputStderr(msg);
      setRunVerdict("Error");
      recordRun(lang, "Error", 0, null);
    } finally {
      setIsTracing(false);
      setIsRunning(false);
    }
  };

  const handleRunAndAnimate = async () => {
    if (language !== "python" && language !== "javascript") {
      setActiveLeftTab("diagram");
      setDiagramNotice(
        `Live step-by-step diagram tracing currently executes Python 3 or JavaScript. Click "Run" to execute ${language.toUpperCase()} output in the console, or switch to Python 3 / JavaScript to watch memory pointers step.`
      );
      return;
    }

    await runTraceForLanguage(language, code);
  };

  // Normal Fast Run
  const handleFastRun = async () => {
    setIsRunning(true);
    setShowConsole(true);
    setConsoleTab("result");
    const startTime = performance.now();

    try {
      const res = await executeAndTrace(language, code, stdin, { trace: false });
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);
      setOutputStdout(res.stdout);
      const verdict = res.error ? "Runtime Error" : "Finished";
      setOutputStderr(res.error ? res.error.message : "");
      setRunVerdict(verdict);
      recordRun(language, verdict, res.steps?.length || 0, elapsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutputStderr(msg);
      setRunVerdict("Error");
      recordRun(language, "Error", 0, null);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit solution to PostgreSQL Judge (runs sample + hidden test cases via worker)
  const handleSubmitToDatabase = async () => {
    const dbQuestionId = selectedProblem.dbId;
    if (!dbQuestionId) {
      await handleFastRun();
      return;
    }

    setIsSubmitting(true);
    setShowConsole(true);
    setConsoleTab("result");
    setOutputStderr("");
    setOutputStdout("Submitting to SPURA judge (grading sample + hidden test cases)...");
    setRunVerdict("Queued");

    try {
      const res = await fetch(`/api/v1/me/questions/${encodeURIComponent(dbQuestionId)}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, sourceCode: code }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setOutputStdout("");
          setOutputStderr("Sign in with an active SPURA cohort account to submit solutions to the database judge.");
          setRunVerdict("Auth Required");
          return;
        }
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Submission failed (${res.status})`);
      }

      const subInit = await res.json();
      const subId: string | undefined = subInit?.submission?.id;
      if (!subId) throw new Error("No submission ID returned");

      let finalSub: DbSubmissionItem & { testsPassed?: number; testsTotal?: number } = subInit.submission;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((r) => setTimeout(r, 500));
        const pollRes = await fetch(`/api/v1/me/submissions/${encodeURIComponent(subId)}`, {
          credentials: "include",
        });
        if (!pollRes.ok) break;
        const pollData = await pollRes.json();
        if (pollData?.submission) {
          finalSub = pollData.submission;
          if (finalSub.status === "completed" || finalSub.status === "failed") {
            break;
          }
        }
      }

      const verdictRaw = finalSub.verdict || finalSub.status || "completed";
      const verdictPretty = verdictRaw
        .split("_")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
      setRunVerdict(verdictPretty);
      setExecutionTimeMs(finalSub.runtimeMs ?? null);

      const passedInfo =
        finalSub.testsPassed != null && finalSub.testsTotal != null
          ? `Tests Passed: ${finalSub.testsPassed} / ${finalSub.testsTotal}\n`
          : "";
      const scoreInfo = finalSub.score != null ? `Score: ${finalSub.score}%\n` : "";
      setOutputStdout(`${passedInfo}${scoreInfo}Verdict: ${verdictPretty}`);
      recordRun(language, verdictPretty, 0, finalSub.runtimeMs ?? null);

      if (verdictRaw === "accepted") {
        recordActivity({ solves: 1 });
      }

      const listRes = await fetch("/api/v1/me/submissions", { credentials: "include" });
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData.submissions)) {
          setDbSubmissions(listData.submissions);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutputStdout("");
      setOutputStderr(msg);
      setRunVerdict("Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract diagram data from current step
  const currentStep: TraceStep | undefined = traceResult?.steps?.[currentStepIndex];
  const heap = currentStep?.heap || {};
  const linkedLists = currentStep ? extractLinkedLists(currentStep, heap) : [];
  const arrays = currentStep ? extractArraysWithPointers(currentStep, heap) : [];
  const trees = currentStep ? extractBinaryTrees(currentStep, heap) : [];
  const stacks = currentStep ? extractStacks(currentStep, heap) : [];

  return (
    <div className="responsive-coding-shell">
      {/* Main 2-Pane Workspace: Left (Problem / Diagram) | Right (Editor & Console) */}
      <div className="responsive-coding-workspace">
        {/* ================= LEFT PANE: Tabs [Description] [Visual Diagram] [Submissions] ================= */}
        <div className="responsive-coding-pane-left">
          {/* Top Tabs Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.4rem",
              padding: "0.35rem 0.75rem",
              minHeight: "44px",
              backgroundColor: "rgba(9, 12, 16, 0.85)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                onClick={() => setActiveLeftTab("description")}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: activeLeftTab === "description" ? 600 : 500,
                  color: activeLeftTab === "description" ? "#ffffff" : "var(--text-secondary)",
                  borderBottom: activeLeftTab === "description" ? "2px solid var(--brand-primary)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                Description
              </button>

              <button
                onClick={() => setActiveLeftTab("diagram")}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: activeLeftTab === "diagram" ? 600 : 500,
                  color: activeLeftTab === "diagram" ? "#ffffff" : "var(--text-secondary)",
                  borderBottom: activeLeftTab === "diagram" ? "2px solid var(--brand-primary)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Visual Diagram</span>
                {totalSteps > 0 && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      padding: "1px 6px",
                      borderRadius: "8px",
                      backgroundColor: "var(--brand-primary)",
                      color: "#090C10",
                      fontWeight: 800,
                    }}
                  >
                    {totalSteps}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveLeftTab("submissions")}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: activeLeftTab === "submissions" ? 600 : 500,
                  color: activeLeftTab === "submissions" ? "#ffffff" : "var(--text-secondary)",
                  borderBottom: activeLeftTab === "submissions" ? "2px solid var(--brand-primary)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                Submissions
              </button>
            </div>

            {/* Problem Switcher: Prev / Searchable Drawer / Next */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <button
                type="button"
                onClick={() => stepAdjacentProblem(-1)}
                title="Previous Problem"
                aria-label="Previous Problem"
                style={{
                  backgroundColor: "#161B24",
                  color: "#E5E7EB",
                  border: "1px solid #262C36",
                  padding: "3px 7px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  lineHeight: 1.2,
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setShowProblemList((v) => !v)}
                aria-expanded={showProblemList}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: showProblemList ? "rgba(245, 158, 11, 0.14)" : "#161B24",
                  color: "#F3F4F6",
                  border: showProblemList ? "1px solid #F59E0B" : "1px solid #262C36",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  maxWidth: "240px",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedProblem.title}
                </span>
                <span
                  style={{
                    color: "#F59E0B",
                    fontSize: "0.68rem",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {currentProblemIndex + 1}/{problemsList.length} ▾
                </span>
              </button>
              <button
                type="button"
                onClick={() => stepAdjacentProblem(1)}
                title="Next Problem"
                aria-label="Next Problem"
                style={{
                  backgroundColor: "#161B24",
                  color: "#E5E7EB",
                  border: "1px solid #262C36",
                  padding: "3px 7px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  lineHeight: 1.2,
                  cursor: "pointer",
                }}
              >
                ›
              </button>

              {showProblemList && (
                <>
                  <div
                    onClick={() => setShowProblemList(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.55)",
                      zIndex: 40,
                    }}
                  />
                  <div
                    role="dialog"
                    aria-label="Problem Browser"
                    style={{
                      position: "fixed",
                      top: "52px",
                      left: "16px",
                      width: "min(560px, calc(100vw - 32px))",
                      maxHeight: "calc(100vh - 80px)",
                      backgroundColor: "#0F1319",
                      border: "1px solid #262C36",
                      borderRadius: "10px",
                      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
                      zIndex: 50,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.75rem 0.9rem",
                        borderBottom: "1px solid #1E242E",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={problemSearch}
                        onChange={(e) => setProblemSearch(e.target.value)}
                        placeholder={`Search ${problemsList.length} problems by title, topic, or company...`}
                        autoFocus
                        style={{
                          flex: 1,
                          backgroundColor: "#161B24",
                          color: "#F3F4F6",
                          border: "1px solid #262C36",
                          borderRadius: "6px",
                          padding: "0.45rem 0.65rem",
                          fontSize: "0.8rem",
                          outline: "none",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#9CA3AF",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {filteredProblems.length} / {problemsList.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowProblemList(false)}
                        aria-label="Close problem browser"
                        style={{
                          backgroundColor: "transparent",
                          color: "#9CA3AF",
                          border: "1px solid #262C36",
                          borderRadius: "6px",
                          padding: "0.3rem 0.55rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div
                      style={{
                        padding: "0.55rem 0.9rem",
                        borderBottom: "1px solid #1E242E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        {(["All", "Easy", "Medium", "Hard"] as const).map((level) => {
                          const active = difficultyFilter === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setDifficultyFilter(level)}
                              style={{
                                backgroundColor: active ? "#F59E0B" : "#161B24",
                                color: active ? "#090C10" : "#D1D5DB",
                                border: active ? "1px solid #F59E0B" : "1px solid #262C36",
                                borderRadius: "9999px",
                                padding: "2px 10px",
                                fontSize: "0.72rem",
                                fontWeight: active ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>

                      <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        style={{
                          backgroundColor: "#161B24",
                          color: "#D1D5DB",
                          border: "1px solid #262C36",
                          borderRadius: "6px",
                          padding: "3px 8px",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          maxWidth: "190px",
                        }}
                      >
                        {problemTopics.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic === "All" ? "All Topics" : topic}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "0.35rem" }}>
                      {filteredProblems.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.8rem" }}>
                          No problems match your filters.
                        </div>
                      ) : (
                        filteredProblems.map((prob) => {
                          const isCurrent = prob.id === selectedProblem.id;
                          const diffColor =
                            prob.difficulty === "Easy"
                              ? "#10B981"
                              : prob.difficulty === "Medium"
                              ? "#F59E0B"
                              : "#F43F5E";
                          return (
                            <button
                              key={prob.id}
                              type="button"
                              onClick={() => {
                                handleProblemChange(prob);
                                setShowProblemList(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.75rem",
                                padding: "0.55rem 0.7rem",
                                borderRadius: "6px",
                                backgroundColor: isCurrent ? "rgba(245, 158, 11, 0.1)" : "transparent",
                                border: "none",
                                borderLeft: isCurrent ? "2px solid #F59E0B" : "2px solid transparent",
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    color: isCurrent ? "#FBBF24" : "#F3F4F6",
                                    fontSize: "0.8rem",
                                    fontWeight: isCurrent ? 600 : 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {prob.title}
                                </div>
                                <div
                                  style={{
                                    color: "#9CA3AF",
                                    fontSize: "0.7rem",
                                    marginTop: "2px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.45rem",
                                  }}
                                >
                                  <span>{prob.topic}</span>
                                  {prob.companies.length > 0 && (
                                    <span>· {prob.companies.slice(0, 2).join(", ")}</span>
                                  )}
                                </div>
                              </div>
                              <span
                                style={{
                                  color: diffColor,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {prob.difficulty}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeLeftTab === "description" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              {/* Problem Title & Meta Badges */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.6rem", letterSpacing: "-0.01em" }}>
                  {selectedProblem.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 600,
                      backgroundColor:
                        selectedProblem.difficulty === "Easy"
                          ? "rgba(16, 185, 129, 0.12)"
                          : selectedProblem.difficulty === "Medium"
                          ? "rgba(245, 158, 11, 0.12)"
                          : "rgba(244, 63, 94, 0.12)",
                      color:
                        selectedProblem.difficulty === "Easy"
                          ? "var(--accent-emerald)"
                          : selectedProblem.difficulty === "Medium"
                          ? "var(--accent-amber)"
                          : "var(--accent-rose)",
                    }}
                  >
                    {selectedProblem.difficulty}
                  </span>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {selectedProblem.topic}
                  </span>

                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Acceptance: {selectedProblem.acceptance}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <div
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  color: "#cbd5e1",
                  whiteSpace: "pre-line",
                  marginBottom: "1.5rem",
                }}
              >
                {selectedProblem.description}
              </div>

              {/* Examples */}
              {selectedProblem.examples.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>Examples:</div>
                  {selectedProblem.examples.map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "var(--bg-code)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.85rem 1rem",
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ marginBottom: "0.25rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Input: </span>
                        <span style={{ color: "var(--text-primary)" }}>{ex.input}</span>
                      </div>
                      <div style={{ marginBottom: ex.explanation ? "0.25rem" : 0 }}>
                        <span style={{ color: "var(--text-muted)" }}>Output: </span>
                        <span style={{ color: "var(--text-primary)" }}>{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div style={{ color: "var(--text-secondary)", fontFamily: "sans-serif", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                          <span style={{ color: "var(--text-muted)" }}>Explanation: </span>
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {selectedProblem.constraints.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                    Constraints:
                  </div>
                  <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {selectedProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL DIAGRAM CANVAS */}
          {activeLeftTab === "diagram" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Diagram Content Area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
                {isTracing ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", color: "var(--text-secondary)" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "2px solid rgba(245, 158, 11, 0.25)",
                        borderTopColor: "var(--brand-primary)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span style={{ fontSize: "0.85rem" }}>Executing code &amp; building diagram...</span>
                  </div>
                ) : !traceResult || totalSteps === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", gap: "0.85rem", color: "var(--text-muted)", padding: "1.5rem" }}>
                    <div style={{ fontSize: "1.5rem", color: "var(--brand-primary)" }}>✦</div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {diagramNotice ? "Python 3 / JavaScript Diagram Tracer" : "Interactive Diagram Ready"}
                    </div>
                    <p style={{ fontSize: "0.85rem", maxWidth: "360px", lineHeight: 1.55, color: diagramNotice ? "#FDE68A" : "var(--text-muted)" }}>
                      {diagramNotice ||
                        'Click "Animate Diagram" in the editor toolbar to run your solution and see the data structure animate step by step.'}
                    </p>
                    {diagramNotice && (
                      <button
                        type="button"
                        onClick={() => {
                          const pyTemplate = selectedProblem.templates.python;
                          setLanguage("python");
                          setCode(pyTemplate);
                          void runTraceForLanguage("python", pyTemplate);
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "var(--brand-gradient)",
                          color: "#090C10",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Switch to Python 3 &amp; Animate →
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedProblem.diagramType === "linked_list" && (
                      <LinkedListDiagram lists={linkedLists} />
                    )}
                    {selectedProblem.diagramType === "array_pointers" && (
                      <ArrayPointersDiagram arrays={arrays} />
                    )}
                    {selectedProblem.diagramType === "binary_tree" && (
                      <BinaryTreeDiagram trees={trees} />
                    )}
                    {selectedProblem.diagramType === "stack" && (
                      <StackQueueDiagram stacks={stacks} />
                    )}
                    {selectedProblem.diagramType === "graph" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {arrays.length > 0 && <ArrayPointersDiagram arrays={arrays} />}
                        {stacks.length > 0 && <StackQueueDiagram stacks={stacks} />}
                        {linkedLists.length > 0 && <LinkedListDiagram lists={linkedLists} />}
                        {trees.length > 0 && <BinaryTreeDiagram trees={trees} />}
                        {arrays.length === 0 && stacks.length === 0 && linkedLists.length === 0 && trees.length === 0 && (
                          <ArrayPointersDiagram arrays={arrays} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diagram Playback Controller (Clean & Minimalist at bottom of Diagram tab) */}
              {totalSteps > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 1rem",
                    backgroundColor: "var(--bg-code)",
                    borderTop: "1px solid var(--border-subtle)",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <button
                      onClick={() => setCurrentStepIndex(0)}
                      disabled={currentStepIndex === 0}
                      title="First Step"
                      style={{
                        padding: "3px 6px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: currentStepIndex === 0 ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      |◀
                    </button>
                    <button
                      onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                      disabled={currentStepIndex === 0}
                      title="Previous Step"
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: currentStepIndex === 0 ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        padding: "3px 12px",
                        backgroundColor: isPlaying ? "var(--accent-amber)" : "var(--brand-primary)",
                        color: "#090C10",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={() => setCurrentStepIndex((p) => Math.min(totalSteps - 1, p + 1))}
                      disabled={currentStepIndex >= totalSteps - 1}
                      title="Next Step"
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: currentStepIndex >= totalSteps - 1 ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => setCurrentStepIndex(totalSteps - 1)}
                      disabled={currentStepIndex >= totalSteps - 1}
                      title="Last Step"
                      style={{
                        padding: "3px 6px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: currentStepIndex >= totalSteps - 1 ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ▶|
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, maxWidth: "260px" }}>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, totalSteps - 1)}
                      value={currentStepIndex}
                      onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--brand-primary)", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", minWidth: "50px", textAlign: "right" }}>
                      {currentStepIndex + 1}/{totalSteps}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    {[
                      { label: "0.5x", ms: 1100 },
                      { label: "1x", ms: 650 },
                      { label: "2x", ms: 300 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setPlaybackSpeed(opt.ms)}
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          backgroundColor: playbackSpeed === opt.ms ? "rgba(245, 158, 11, 0.2)" : "transparent",
                          color: playbackSpeed === opt.ms ? "#FBBF24" : "var(--text-muted)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {currentStep && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        color: "var(--brand-primary)",
                        fontWeight: 600,
                      }}
                    >
                      Line {currentStep.line}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS */}
          {activeLeftTab === "submissions" && (
            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Session Run History ({runHistory.length})
              </div>
              {runHistory.length === 0 ? (
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  Your code executions and diagram trace runs in this session will appear here.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {runHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-code)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.problemTitle}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {item.language.toUpperCase()} • {item.timeLabel}
                          {item.stepsCount > 0 ? ` • ${item.stepsCount} diagram steps` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: item.verdict === "Accepted" || item.verdict === "Finished" ? "#10B981" : "#F43F5E",
                          }}
                        >
                          {item.verdict}
                        </span>
                        {item.durationMs !== null && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.durationMs} ms</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Database Judge Submissions ({dbSubmissions.length})
              </div>
              {dbSubmissions.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>
                  Click &quot;Submit&quot; in the toolbar while signed in to grade your solution against hidden test cases and save it to PostgreSQL.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {dbSubmissions.map((sub) => {
                    const verdictLabel = (sub.verdict || sub.status || "queued").replace(/_/g, " ");
                    const isAccepted = sub.verdict === "accepted";
                    return (
                      <div
                        key={sub.id}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          backgroundColor: "var(--bg-code)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {sub.questionTitle || selectedProblem.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {sub.language.toUpperCase()} • {new Date(sub.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textTransform: "capitalize",
                              color: isAccepted ? "#10B981" : sub.status === "completed" ? "#F43F5E" : "#F59E0B",
                            }}
                          >
                            {verdictLabel}
                          </span>
                          {sub.runtimeMs !== null && (
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{sub.runtimeMs} ms</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT PANE: Code Editor & Execution (Clean & Spacious) ================= */}
        <div className="responsive-coding-pane-right">
          {/* Editor Header Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.4rem",
              padding: "0.35rem 0.75rem",
              minHeight: "44px",
              backgroundColor: "rgba(9, 12, 16, 0.85)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {/* Language Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as EditorLanguage)}
                style={{
                  backgroundColor: "var(--bg-code)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="python">Python 3 (Visual Trace)</option>
                <option value="javascript">JavaScript (Visual Trace)</option>
                <option value="cpp">C++ (G++ 14 • Fast Run)</option>
                <option value="java">Java (JDK 21 • Fast Run)</option>
              </select>

              <button
                onClick={() => setCode(selectedProblem.templates[language])}
                title="Reset starter template"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--text-muted)",
                  padding: "4px 6px",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span>↺</span>
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Actions (Run, Submit to DB & Animate) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <button
                onClick={handleFastRun}
                disabled={isRunning || isSubmitting}
                style={{
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isRunning ? "Running..." : "Run"}
              </button>

              {selectedProblem.dbId && (
                <button
                  onClick={handleSubmitToDatabase}
                  disabled={isSubmitting || isRunning}
                  title="Submit to SPURA Judge & save to PostgreSQL"
                  style={{
                    padding: "5px 12px",
                    backgroundColor: "rgba(16, 185, 129, 0.14)",
                    border: "1px solid rgba(16, 185, 129, 0.45)",
                    color: "#34D399",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Judging..." : "Submit"}
                </button>
              )}

              <button
                onClick={handleRunAndAnimate}
                disabled={isTracing}
                style={{
                  padding: "5px 14px",
                  background: "var(--brand-gradient)",
                  color: "#090C10",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
                  cursor: "pointer",
                }}
              >
                {isTracing ? "Animating..." : "Animate Diagram"}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div style={{ flex: 1, minHeight: "240px", position: "relative" }}>
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : language === "java" ? "java" : "python"}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: "JetBrains Mono, Menlo, Monaco, 'Courier New', monospace",
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Bottom Console Drawer (LeetCode / CodeHelp style collapsible drawer) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--bg-surface)",
              borderTop: "1px solid var(--border-subtle)",
              maxHeight: showConsole ? "220px" : "36px",
              transition: "max-height 0.2s ease",
              overflow: "hidden",
            }}
          >
            {/* Console Toolbar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 1rem",
                height: "36px",
                backgroundColor: "rgba(9, 12, 16, 0.85)",
                borderBottom: showConsole ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  onClick={() => {
                    setShowConsole(true);
                    setConsoleTab("result");
                  }}
                  style={{
                    padding: "3px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    color: consoleTab === "result" ? "#ffffff" : "var(--text-muted)",
                    backgroundColor: consoleTab === "result" && showConsole ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  }}
                >
                  Result {runVerdict && `(${runVerdict})`}
                </button>

                <button
                  onClick={() => {
                    setShowConsole(true);
                    setConsoleTab("testcase");
                  }}
                  style={{
                    padding: "3px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    color: consoleTab === "testcase" ? "#ffffff" : "var(--text-muted)",
                    backgroundColor: consoleTab === "testcase" && showConsole ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  }}
                >
                  Testcase
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {executionTimeMs !== null && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Runtime: {executionTimeMs} ms
                  </span>
                )}
                <button
                  onClick={() => setShowConsole(!showConsole)}
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                  }}
                >
                  {showConsole ? "▼ Console" : "▲ Console"}
                </button>
              </div>
            </div>

            {/* Console Drawer Body */}
            {showConsole && (
              <div style={{ flex: 1, padding: "0.85rem", overflowY: "auto", fontFamily: "monospace", fontSize: "0.8rem", backgroundColor: "var(--bg-code)" }}>
                {consoleTab === "result" ? (
                  <div>
                    {outputStderr && (
                      <div style={{ color: "var(--accent-rose)", marginBottom: "0.4rem" }}>
                        ⚠️ {outputStderr}
                      </div>
                    )}
                    {outputStdout ? (
                      <pre style={{ margin: 0, color: "var(--accent-cyan)", whiteSpace: "pre-wrap" }}>{outputStdout}</pre>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                        Click &quot;Run&quot; or &quot;Animate Diagram&quot; to test your code.
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Custom Stdin:
                    </div>
                    <textarea
                      rows={4}
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Enter custom test input..."
                      style={{
                        width: "100%",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "6px 8px",
                        fontSize: "0.8rem",
                        resize: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodingPageContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("problem");
  const initialTab = searchParams.get("tab");
  return <CodingWorkspace key={`${initialSlug ?? ""}:${initialTab ?? ""}`} initialSlug={initialSlug} initialTab={initialTab} />;
}

export default function CodingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100vh - 56px)",
            backgroundColor: "var(--bg-main)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Loading compiler workspace...
        </div>
      }
    >
      <CodingPageContent />
    </Suspense>
  );
}
