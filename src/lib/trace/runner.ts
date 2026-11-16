import { runJavaScript } from "./js-runtime";
import { PYTHON_TRACER } from "./python-tracer";
import type { TraceResult } from "./types";

interface PyodideInstance {
  globals: {
    set: (name: string, value: unknown) => void;
  };
  runPythonAsync: (code: string) => Promise<string>;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
    _pyodideInstance?: PyodideInstance;
    _pyodideLoading?: Promise<PyodideInstance>;
  }
}

/**
 * Loads Pyodide in browser environment lazily.
 */
async function getPyodide(onProgress?: (msg: string) => void): Promise<PyodideInstance> {
  if (typeof window === "undefined") {
    throw new Error("Pyodide runs in the browser environment.");
  }

  if (window._pyodideInstance) {
    return window._pyodideInstance;
  }

  if (window._pyodideLoading) {
    return window._pyodideLoading;
  }

  window._pyodideLoading = (async () => {
    onProgress?.("Loading Python runtime...");

    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
        document.head.appendChild(script);
      });
    }

    if (!window.loadPyodide) {
      throw new Error("Pyodide script loaded but window.loadPyodide is missing.");
    }

    onProgress?.("Initializing Python engine...");
    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });

    onProgress?.("Configuring Python tracer...");
    await pyodide.runPythonAsync(PYTHON_TRACER);

    window._pyodideInstance = pyodide;
    return pyodide;
  })();

  return window._pyodideLoading;
}

/**
 * Execute and trace code for either Python or JavaScript.
 */
export async function executeAndTrace(
  language: "python" | "javascript" | string,
  sourceCode: string,
  stdin: string = "",
  options: {
    trace?: boolean;
    onProgress?: (status: string) => void;
  } = {}
): Promise<TraceResult> {
  const trace = options.trace ?? true;

  if (language === "javascript" || language === "js") {
    options.onProgress?.("Tracing JavaScript execution...");
    return runJavaScript(sourceCode, stdin, trace);
  }

  if (language === "python" || language === "py") {
    try {
      const pyodide = await getPyodide(options.onProgress);
      options.onProgress?.("Running Python tracer...");

      // Set globals into python scope safely
      pyodide.globals.set("_user_code", sourceCode);
      pyodide.globals.set("_user_stdin", stdin);
      pyodide.globals.set("_user_trace", trace);

      const jsonStr = await pyodide.runPythonAsync(`_el_run(_user_code, _user_stdin, _user_trace)`);
      const result: TraceResult = JSON.parse(jsonStr);
      return result;
    } catch (err: unknown) {
      return {
        steps: [],
        stdout: "",
        error: { message: err instanceof Error ? err.message : String(err) },
        truncated: false,
      };
    }
  }

  if (language === "cpp" || language === "java") {
    try {
      options.onProgress?.(`Compiling & running ${language.toUpperCase()}...`);
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: sourceCode, stdin }),
      });
      const data = (await res.json()) as {
        stdout?: string;
        error?: { message: string; line?: number } | null;
      };
      return {
        steps: [],
        stdout: data.stdout ?? "",
        error: data.error ?? null,
        truncated: false,
      };
    } catch (err: unknown) {
      return {
        steps: [],
        stdout: "",
        error: { message: err instanceof Error ? err.message : String(err) },
        truncated: false,
      };
    }
  }

  return {
    steps: [],
    stdout: "",
    error: { message: `Unsupported language: ${language}` },
    truncated: false,
  };
}
