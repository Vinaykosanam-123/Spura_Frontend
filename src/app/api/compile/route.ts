import { NextResponse } from "next/server";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const MAX_OUTPUT_BYTES = 64 * 1024;
const COMPILE_TIMEOUT_MS = 8000;
const RUN_TIMEOUT_MS = 4000;

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
      env: { ...process.env, PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/local/bin", LANG: "C.UTF-8" },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString("utf8").slice(0, MAX_OUTPUT_BYTES - stdout.length);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString("utf8").slice(0, MAX_OUTPUT_BYTES - stderr.length);
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

export async function POST(req: Request) {
  let workDir: string | null = null;
  try {
    const body = (await req.json()) as {
      language?: string;
      code?: string;
      stdin?: string;
    };
    const language = body.language;
    const code = typeof body.code === "string" ? body.code : "";
    const stdin = typeof body.stdin === "string" ? body.stdin : "";

    if ((language !== "cpp" && language !== "java") || !code.trim()) {
      return NextResponse.json(
        { stdout: "", error: { message: "Unsupported language or empty source code." } },
        { status: 400 }
      );
    }

    workDir = await mkdtemp(path.join(tmpdir(), "spura-compile-"));

    if (language === "cpp") {
      const srcFile = path.join(workDir, "main.cpp");
      const binFile = path.join(workDir, "main.out");
      await writeFile(srcFile, code, "utf8");

      const compileRes = await runProcess(
        "g++",
        ["-O2", "-std=c++20", srcFile, "-o", binFile],
        workDir,
        "",
        COMPILE_TIMEOUT_MS
      );
      if (compileRes.timedOut) {
        return NextResponse.json({
          stdout: "",
          error: { message: "Compilation timed out." },
        });
      }
      if (compileRes.exitCode !== 0) {
        return NextResponse.json({
          stdout: "",
          error: { message: compileRes.stderr.trim() || "C++ compilation failed." },
        });
      }

      const execRes = await runProcess(binFile, [], workDir, stdin, RUN_TIMEOUT_MS);
      if (execRes.timedOut) {
        return NextResponse.json({
          stdout: execRes.stdout,
          error: { message: `Time Limit Exceeded (${RUN_TIMEOUT_MS}ms)` },
        });
      }
      if (execRes.exitCode !== 0) {
        return NextResponse.json({
          stdout: execRes.stdout,
          error: {
            message:
              execRes.stderr.trim() || `Runtime error (exit code ${execRes.exitCode ?? 1})`,
          },
        });
      }
      return NextResponse.json({ stdout: execRes.stdout, error: null });
    }

    // Java
    const srcFile = path.join(workDir, "Main.java");
    await writeFile(srcFile, code, "utf8");

    const compileRes = await runProcess(
      "javac",
      ["-encoding", "UTF-8", srcFile],
      workDir,
      "",
      COMPILE_TIMEOUT_MS
    );
    if (compileRes.timedOut) {
      return NextResponse.json({
        stdout: "",
        error: { message: "Java compilation timed out." },
      });
    }
    if (compileRes.exitCode !== 0) {
      return NextResponse.json({
        stdout: "",
        error: { message: compileRes.stderr.trim() || "Java compilation failed." },
      });
    }

    const execRes = await runProcess(
      "java",
      ["-Xmx256m", "-cp", workDir, "Main"],
      workDir,
      stdin,
      RUN_TIMEOUT_MS
    );
    if (execRes.timedOut) {
      return NextResponse.json({
        stdout: execRes.stdout,
        error: { message: `Time Limit Exceeded (${RUN_TIMEOUT_MS}ms)` },
      });
    }
    if (execRes.exitCode !== 0) {
      return NextResponse.json({
        stdout: execRes.stdout,
        error: {
          message:
            execRes.stderr.trim() || `Runtime error (exit code ${execRes.exitCode ?? 1})`,
        },
      });
    }
    return NextResponse.json({ stdout: execRes.stdout, error: null });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        stdout: "",
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
