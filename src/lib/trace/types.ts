/**
 * Execution trace format shared by the Python (Pyodide) and JavaScript tracers
 * and rendered by the step-by-step Visualizer.
 */

/** A value is either an inline primitive or a reference to a heap object. */
export type TraceValue =
  | { t: "p"; r: string; k: string; n?: number }
  | { t: "r"; id: string };

export type HeapObject =
  | { kind: "list" | "tuple" | "set" | "frozenset" | "deque"; items: TraceValue[]; len: number }
  | { kind: "dict"; entries: [TraceValue, TraceValue][]; len: number; cls?: string }
  | { kind: "object"; cls: string; fields: [string, TraceValue][] };

export type TraceFrame = {
  name: string;
  line: number;
  vars: [string, TraceValue][];
  ret?: TraceValue;
};

export type TraceStep = {
  line: number;
  event: "line" | "return" | "exception";
  stack: TraceFrame[];
  heap: Record<string, HeapObject | null>;
  stdout: string;
  error?: string;
};

export type TraceResult = {
  steps: TraceStep[];
  stdout: string;
  error: { message: string; line?: number } | null;
  truncated: boolean;
};

export type VisualLanguage = "python" | "javascript";
export const VISUAL_LANGUAGES: readonly string[] = ["python", "javascript"];
