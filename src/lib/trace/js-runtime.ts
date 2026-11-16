import { InstrumentError, instrumentJavaScript } from "./js-instrument";
import type { HeapObject, TraceFrame, TraceResult, TraceStep, TraceValue } from "./types";

const MAX_STEPS = 1500;
const MAX_ITEMS = 64;
const MAX_STACK = 200;
const NOVALUE = Symbol("novalue");

class StepLimit extends Error {}
class StackLimit extends Error {}

type LiveFrame = { name: string; line: number; vars: Record<string, unknown>; ret?: { value: unknown } };

function formatForConsole(value: unknown, seen = new WeakSet<object>(), depth = 0): string {
  if (typeof value === "string") return depth === 0 ? value : JSON.stringify(value);
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value !== "object" || value === null) return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (depth > 4) return Array.isArray(value) ? "[Array]" : "[Object]";
  if (Array.isArray(value)) return `[ ${value.map((v) => formatForConsole(v, seen, depth + 1)).join(", ")} ]`.replace("[  ]", "[]");
  if (value instanceof Map) {
    return `Map(${value.size}) { ${[...value].map(([k, v]) => `${formatForConsole(k, seen, depth + 1)} => ${formatForConsole(v, seen, depth + 1)}`).join(", ")} }`;
  }
  if (value instanceof Set) return `Set(${value.size}) { ${[...value].map((v) => formatForConsole(v, seen, depth + 1)).join(", ")} }`;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
  const name = (value as object).constructor?.name;
  const body = Object.entries(value as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${formatForConsole(v, seen, depth + 1)}`)
    .join(", ");
  const prefix = name && name !== "Object" ? `${name} ` : "";
  return body ? `${prefix}{ ${body} }` : `${prefix}{}`;
}

/** Run JavaScript and return a step-by-step trace (or only output when trace=false). */
export function runJavaScript(source: string, stdin: string, trace: boolean): TraceResult {
  const steps: TraceStep[] = [];
  let stdout = "";
  let error: TraceResult["error"] = null;
  let truncated = false;

  let code: string;
  try {
    code = trace ? instrumentJavaScript(source) : source;
  } catch (e) {
    const err = e as InstrumentError;
    return { steps: [], stdout: "", error: { message: err.message, line: err.line }, truncated: false };
  }

  // ---- heap encoding (ids are stable across steps for the same object)
  const ids = new WeakMap<object, string>();
  let nextId = 1;
  const idOf = (o: object) => {
    let id = ids.get(o);
    if (!id) {
      id = `o${nextId++}`;
      ids.set(o, id);
    }
    return id;
  };

  const enc = (value: unknown, heap: Record<string, HeapObject | null>, depth: number): TraceValue => {
    if (value === null) return { t: "p", r: "null", k: "null" };
    switch (typeof value) {
      case "undefined":
        return { t: "p", r: "undefined", k: "undefined" };
      case "number":
        return Number.isInteger(value) ? { t: "p", r: String(value), k: "number", n: value } : { t: "p", r: String(value), k: "number" };
      case "boolean":
        return { t: "p", r: String(value), k: "boolean" };
      case "string":
        return { t: "p", r: JSON.stringify(value.length > 120 ? value.slice(0, 120) + "…" : value), k: "string" };
      case "bigint":
        return { t: "p", r: `${value}n`, k: "bigint" };
      case "symbol":
        return { t: "p", r: value.toString(), k: "symbol" };
      case "function": {
        const fn = value as { name?: string; toString(): string };
        const isClass = /^class[\s{]/.test(Function.prototype.toString.call(fn));
        return { t: "p", r: `${isClass ? "class" : "ƒ"} ${fn.name || "anonymous"}`, k: isClass ? "class" : "function" };
      }
    }
    const obj = value as object;
    const id = idOf(obj);
    if (id in heap) return { t: "r", id };
    if (depth > 40) return { t: "p", r: "…", k: "deep" };
    heap[id] = null;
    if (Array.isArray(obj)) {
      heap[id] = { kind: "list", items: obj.slice(0, MAX_ITEMS).map((v) => enc(v, heap, depth + 1)), len: obj.length };
    } else if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
      const arr = Array.from(obj as unknown as ArrayLike<number>);
      heap[id] = { kind: "list", items: arr.slice(0, MAX_ITEMS).map((v) => enc(v, heap, depth + 1)), len: arr.length };
    } else if (obj instanceof Map) {
      const entries = [...obj.entries()].slice(0, MAX_ITEMS);
      heap[id] = {
        kind: "dict",
        cls: "Map",
        entries: entries.map(([k, v]) => [enc(k, heap, depth + 1), enc(v, heap, depth + 1)] as [TraceValue, TraceValue]),
        len: obj.size
      };
    } else if (obj instanceof Set) {
      heap[id] = { kind: "set", items: [...obj].slice(0, MAX_ITEMS).map((v) => enc(v, heap, depth + 1)), len: obj.size };
    } else {
      const cls = (obj as { constructor?: { name?: string } }).constructor?.name || "Object";
      const fields = Object.keys(obj)
        .slice(0, MAX_ITEMS)
        .map((k) => [k, enc((obj as Record<string, unknown>)[k], heap, depth + 1)] as [string, TraceValue]);
      heap[id] = { kind: "object", cls, fields };
    }
    return { t: "r", id };
  };

  // ---- runtime hooks
  const stack: LiveFrame[] = [{ name: "Global frame", line: 0, vars: {} }];

  const clean = (vars: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(vars)) if (v !== NOVALUE) out[k] = v;
    return out;
  };

  const record = (line: number, event: TraceStep["event"], err?: string) => {
    const heap: Record<string, HeapObject | null> = {};
    const frames: TraceFrame[] = stack.map((frame) => {
      const out: TraceFrame = {
        name: frame.name,
        line: frame.line,
        vars: Object.entries(frame.vars).map(([k, v]) => [k, enc(v, heap, 0)] as [string, TraceValue])
      };
      if (frame.ret) out.ret = enc(frame.ret.value, heap, 0);
      return out;
    });
    const step: TraceStep = { line, event, stack: frames, heap, stdout };
    if (err) step.error = err;
    steps.push(step);
  };

  const __v = (getter: () => unknown) => {
    try {
      return getter();
    } catch {
      return NOVALUE;
    }
  };

  const __T = (line: number, getLocals: () => Record<string, unknown>, getGlobals?: () => Record<string, unknown>) => {
    if (steps.length >= MAX_STEPS) throw new StepLimit();
    const top = stack[stack.length - 1];
    top.line = line;
    top.ret = undefined;
    top.vars = clean(getLocals());
    if (getGlobals && stack.length > 1) Object.assign(stack[0].vars, clean(getGlobals()));
    record(line, "line");
  };

  const __E = (name: string, line: number) => {
    if (stack.length >= MAX_STACK) throw new StackLimit("RangeError: Maximum call stack size exceeded");
    stack.push({ name, line, vars: {} });
  };

  const __X = () => {
    if (stack.length > 1) stack.pop();
  };

  const __R = (line: number, value: unknown) => {
    const top = stack[stack.length - 1];
    if (stack.length > 1 && steps.length < MAX_STEPS) {
      top.line = line;
      top.ret = { value };
      record(line, "return");
      top.ret = undefined;
    }
    return value;
  };

  // ---- I/O shims (console, input(), fs.readFileSync(0), readline)
  const write = (text: string) => {
    stdout += text;
    if (stdout.length > 100_000) stdout = stdout.slice(0, 100_000);
  };
  const log = (...args: unknown[]) => write(args.map((a) => formatForConsole(a)).join(" ") + "\n");
  const fakeConsole = { log, info: log, warn: log, error: log, debug: log, table: log };

  const lines = stdin.split(/\r?\n/);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  let cursor = 0;
  const input = (prompt?: string) => {
    if (prompt) write(String(prompt));
    if (cursor >= lines.length) return null;
    return lines[cursor++];
  };

  const lineHandlers: Array<(line: string) => void> = [];
  const closeHandlers: Array<() => void> = [];
  const fakeRequire = (name: string) => {
    if (name === "fs" || name === "node:fs") {
      return { readFileSync: () => stdin };
    }
    if (name === "readline" || name === "node:readline") {
      return {
        createInterface: () => {
          const rl = {
            on(event: string, handler: (line: string) => void) {
              if (event === "line") lineHandlers.push(handler);
              if (event === "close") closeHandlers.push(() => handler(""));
              return rl;
            },
            close() {},
            question(q: string, cb: (a: string) => void) {
              write(q);
              cb(input() ?? "");
            },
            [Symbol.iterator]() {
              let idx = 0;
              return {
                next(): IteratorResult<string> {
                  if (idx < lines.length) return { value: lines[idx++], done: false };
                  return { value: undefined as unknown as string, done: true };
                }
              };
            }
          };
          return rl;
        }
      };
    }
    throw new Error(`Cannot find module '${name}' (not available in the visualizer)`);
  };
  const fakeProcess = {
    stdout: { write: (s: unknown) => (write(String(s)), true) },
    stdin: { on() {}, resume() {}, setEncoding() {} },
    argv: [],
    env: {},
    exit: () => {
      throw new StepLimit("exit");
    }
  };

  const fail = (e: unknown) => {
    if (e instanceof StepLimit) {
      if (e.message !== "exit") truncated = true;
      return;
    }
    const message =
      e instanceof StackLimit
        ? e.message
        : e instanceof Error
          ? `${e.name}: ${e.message}`
          : `Uncaught ${formatForConsole(e)}`;
    const line = stack[stack.length - 1]?.line || undefined;
    error = { message, line };
    if (trace) record(line ?? 0, "exception", message);
  };

  try {
    const fn = new Function(
      "__T", "__E", "__X", "__R", "__v", "console", "require", "process", "input", "prompt", "readline",
      code
    );
    fn(__T, __E, __X, __R, __v, fakeConsole, fakeRequire, fakeProcess, input, input, () => input());
    for (const line of lines) for (const handler of lineHandlers) handler(line);
    for (const handler of closeHandlers) handler();
  } catch (e) {
    fail(e);
  }

  return { steps, stdout, error, truncated };
}
