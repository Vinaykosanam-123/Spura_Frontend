import { NextResponse } from "next/server";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  extractSpuraTraceFromStderr,
  instrumentCppForTrace,
} from "@/lib/trace/cpp-tracer";
import { instrumentJavaForTrace } from "@/lib/trace/java-tracer";
import type { TraceStep } from "@/lib/trace/types";

const MAX_STDOUT_BYTES = 64 * 1024;
const MAX_STDERR_BYTES = 1024 * 1024;
const MAX_SOURCE_BYTES = 128 * 1024;
const COMPILE_TIMEOUT_MS = 10000;
const RUN_TIMEOUT_MS = 4500;

const BITS_SHIM_HEADER = `#pragma once
#include <iostream>
#include <sstream>
#include <iomanip>
#include <string>
#include <vector>
#include <array>
#include <deque>
#include <list>
#include <stack>
#include <queue>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <climits>
#include <cfloat>
#include <cstring>
#include <cctype>
#include <utility>
#include <tuple>
#include <functional>
#include <bitset>
`;

function safeChildEnv(): NodeJS.ProcessEnv {
  const basePath = process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin";
  const extraJavaPaths = [
    "/opt/homebrew/opt/openjdk/bin",
    "/usr/local/opt/openjdk/bin",
  ];
  const mergedPath = [...extraJavaPaths, basePath].join(":");
  return {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PATH: mergedPath,
    LANG: "C.UTF-8",
    TMPDIR: process.env.TMPDIR ?? "/tmp",
    HOME: tmpdir(),
  };
}

function runProcess(
  cmd: string,
  args: string[],
  cwd: string,
  stdin: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: safeChildEnv(),
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_STDOUT_BYTES) {
        stdout += chunk.toString("utf8").slice(0, MAX_STDOUT_BYTES - stdout.length);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_STDERR_BYTES) {
        stderr += chunk.toString("utf8").slice(0, MAX_STDERR_BYTES - stderr.length);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr || err.message, exitCode: 1, timedOut });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

function detectJavaMainClass(code: string): string {
  const publicMatch = code.match(/\bpublic\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
  if (publicMatch?.[1]) return publicMatch[1];
  const mainClassMatch = code.match(/\bclass\s+(Main)\b/);
  if (mainClassMatch?.[1]) return mainClassMatch[1];
  const anyClass = code.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return anyClass?.[1] || "Main";
}

function isLocalCompileAllowed(): boolean {
  // Unconditionally disabled in production — untrusted student code must never
  // compile or execute directly inside the Next.js container.
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.ALLOW_UNSAFE_LOCAL_COMPILE === "true";
}

export async function POST(req: Request) {
  if (!isLocalCompileAllowed()) {
    return NextResponse.json(
      {
        stdout: "",
        steps: [],
        truncated: false,
        error: {
          code: "LOCAL_COMPILE_DISABLED",
          message:
            "Direct compilation inside the frontend container is disabled. Use the isolated Practice judge API or set ALLOW_UNSAFE_LOCAL_COMPILE=true in local development only.",
        },
      },
      { status: 403 }
    );
  }

  let workDir: string | null = null;
  try {
    const body = (await req.json()) as {
      language?: string;
      code?: string;
      stdin?: string;
      trace?: boolean;
    };
    const language = body.language;
    const code = typeof body.code === "string" ? body.code : "";
    const stdin = typeof body.stdin === "string" ? body.stdin : "";
    const traceRequested = Boolean(body.trace);

    if ((language !== "cpp" && language !== "java") || !code.trim()) {
      return NextResponse.json(
        { stdout: "", steps: [], truncated: false, error: { message: "Unsupported language or empty source code." } },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(code, "utf8") > MAX_SOURCE_BYTES) {
      return NextResponse.json(
        { stdout: "", steps: [], truncated: false, error: { message: "Source code exceeds 128 KB limit." } },
        { status: 400 }
      );
    }

    workDir = await mkdtemp(path.join(tmpdir(), "spura-compile-"));

    if (language === "cpp") {
      const shimDir = path.join(workDir, "_shim");
      await mkdir(path.join(shimDir, "bits"), { recursive: true });
      await writeFile(path.join(shimDir, "bits", "stdc++.h"), BITS_SHIM_HEADER, "utf8");

      const srcFile = path.join(workDir, "main.cpp");
      const binFile = path.join(workDir, "main.out");
      const instrumentedCode = traceRequested ? instrumentCppForTrace(code) : code;

      await writeFile(srcFile, instrumentedCode, "utf8");
      let compileRes = await runProcess(
        "g++",
        [traceRequested ? "-O0" : "-O2", "-std=c++20", "-idirafter", shimDir, srcFile, "-o", binFile],
        workDir,
        "",
        COMPILE_TIMEOUT_MS
      );

      let usedTrace = traceRequested;
      if (traceRequested && compileRes.exitCode !== 0 && !compileRes.timedOut) {
        // Retry uninstrumented code so user sees clean compiler diagnostics or direct stdout
        await writeFile(srcFile, code, "utf8");
        compileRes = await runProcess(
          "g++",
          ["-O2", "-std=c++20", "-idirafter", shimDir, srcFile, "-o", binFile],
          workDir,
          "",
          COMPILE_TIMEOUT_MS
        );
        usedTrace = false;
      }

      if (compileRes.timedOut) {
        return NextResponse.json({
          stdout: "",
          steps: [],
          truncated: false,
          error: { message: "Compilation timed out." },
        });
      }
      if (compileRes.exitCode !== 0) {
        return NextResponse.json({
          stdout: "",
          steps: [],
          truncated: false,
          error: { message: compileRes.stderr.trim() || "C++ compilation failed." },
        });
      }

      const execRes = await runProcess(binFile, [], workDir, stdin, RUN_TIMEOUT_MS);
      let steps: TraceStep[] = [];
      let truncated = false;
      let cleanStderr = execRes.stderr;

      if (usedTrace) {
        const extracted = extractSpuraTraceFromStderr(execRes.stderr);
        steps = extracted.steps;
        truncated = extracted.truncated;
        cleanStderr = extracted.cleanStderr;
      }

      if (execRes.timedOut) {
        return NextResponse.json({
          stdout: execRes.stdout,
          steps,
          truncated,
          error: { message: `Time Limit Exceeded (${RUN_TIMEOUT_MS}ms)` },
        });
      }
      if (execRes.exitCode !== 0) {
        return NextResponse.json({
          stdout: execRes.stdout,
          steps,
          truncated,
          error: {
            message:
              cleanStderr.trim() || `Runtime error (exit code ${execRes.exitCode ?? 1})`,
          },
        });
      }
      return NextResponse.json({ stdout: execRes.stdout, steps, truncated, error: null });
    }

    // Java
    const mainClass = detectJavaMainClass(code);
    const srcFile = path.join(workDir, `${mainClass}.java`);
    const instrumentedCode = traceRequested ? instrumentJavaForTrace(code) : code;

    await writeFile(srcFile, instrumentedCode, "utf8");
    let compileRes = await runProcess(
      "javac",
      ["-encoding", "UTF-8", srcFile],
      workDir,
      "",
      COMPILE_TIMEOUT_MS
    );

    let usedTrace = traceRequested;
    if (traceRequested && compileRes.exitCode !== 0 && !compileRes.timedOut) {
      await writeFile(srcFile, code, "utf8");
      compileRes = await runProcess(
        "javac",
        ["-encoding", "UTF-8", srcFile],
        workDir,
        "",
        COMPILE_TIMEOUT_MS
      );
      usedTrace = false;
    }

    if (compileRes.timedOut) {
      return NextResponse.json({
        stdout: "",
        steps: [],
        truncated: false,
        error: { message: "Java compilation timed out." },
      });
    }
    if (compileRes.exitCode !== 0) {
      return NextResponse.json({
        stdout: "",
        steps: [],
        truncated: false,
        error: { message: compileRes.stderr.trim() || "Java compilation failed." },
      });
    }

    const execRes = await runProcess(
      "java",
      ["-Xmx256m", "-cp", workDir, mainClass],
      workDir,
      stdin,
      RUN_TIMEOUT_MS
    );

    let steps: TraceStep[] = [];
    let truncated = false;
    let cleanStderr = execRes.stderr;

    if (usedTrace) {
      const extracted = extractSpuraTraceFromStderr(execRes.stderr);
      steps = extracted.steps;
      truncated = extracted.truncated;
      cleanStderr = extracted.cleanStderr;
    }

    if (execRes.timedOut) {
      return NextResponse.json({
        stdout: execRes.stdout,
        steps,
        truncated,
        error: { message: `Time Limit Exceeded (${RUN_TIMEOUT_MS}ms)` },
      });
    }
    if (execRes.exitCode !== 0) {
      return NextResponse.json({
        stdout: execRes.stdout,
        steps,
        truncated,
        error: {
          message:
            cleanStderr.trim() || `Runtime error (exit code ${execRes.exitCode ?? 1})`,
        },
      });
    }
    return NextResponse.json({ stdout: execRes.stdout, steps, truncated, error: null });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        stdout: "",
        steps: [],
        truncated: false,
        error: { message: err instanceof Error ? err.message : "Compiler execution error" },
      },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
