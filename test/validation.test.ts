import { describe, expect, it } from "vitest";
import { runValidation, runValidations } from "../src/validation.js";

describe("runValidation", () => {
  it("resolves with status passed when command succeeds", async () => {
    const result = await runValidation("echo hello", process.cwd());
    expect(result.status).toBe("passed");
    expect(result.output).toContain("hello");
  });

  it("resolves with status failed when command exits non-zero", async () => {
    const result = await runValidation("node -e \"process.exit(1)\"", process.cwd());
    expect(result.status).toBe("failed");
  });

  it("includes stderr in output on failure", async () => {
    const result = await runValidation(
      "node -e \"process.stderr.write('err msg'); process.exit(1)\"",
      process.cwd(),
    );
    expect(result.status).toBe("failed");
    expect(result.output).toContain("err msg");
  });

  it("does not execute shell-injected commands after semicolon", async () => {
    const result = await runValidation('echo hello; node -e "process.exit(1)"', process.cwd());
    expect(result.status).toBe("passed");
  });

  it("preserves command string in passed result", async () => {
    const result = await runValidation("echo hello", process.cwd());
    expect(result.command).toBe("echo hello");
  });

  it("preserves command string in failed result", async () => {
    const result = await runValidation("node -e \"process.exit(1)\"", process.cwd());
    expect(result.command).toBe("node -e \"process.exit(1)\"");
  });

  it("stdout is captured in the output field on success", async () => {
    const result = await runValidation("echo captured-output", process.cwd());
    expect(result.output).toContain("captured-output");
  });

  it("output field is a string", async () => {
    const result = await runValidation("echo hello", process.cwd());
    expect(typeof result.output).toBe("string");
  });

  it("status is exactly the string 'passed' on success", async () => {
    const result = await runValidation("echo ok", process.cwd());
    expect(result.status).toBe("passed");
  });

  it("status is exactly the string 'failed' on failure", async () => {
    const result = await runValidation("node -e \"process.exit(2)\"", process.cwd());
    expect(result.status).toBe("failed");
  });

  it("returns a Promise", () => {
    const result = runValidation("echo hello", process.cwd());
    expect(result).toBeInstanceOf(Promise);
  });

  it("handles node -e with double-quoted argument correctly", async () => {
    const result = await runValidation(
      "node -e \"process.stdout.write('ok')\"",
      process.cwd(),
    );
    expect(result.status).toBe("passed");
    expect(result.output).toContain("ok");
  });

  it("does not throw when command fails — always resolves", async () => {
    await expect(runValidation("node -e \"process.exit(99)\"", process.cwd())).resolves.toBeDefined();
  });

  it("result has command, status, and output properties", async () => {
    const result = await runValidation("echo hi", process.cwd());
    expect(result).toHaveProperty("command");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("output");
  });
});

describe("runValidations", () => {
  it("returns empty array for empty command list", async () => {
    const results = await runValidations([], process.cwd());
    expect(results).toEqual([]);
  });

  it("returns one result for one command", async () => {
    const results = await runValidations(["echo hello"], process.cwd());
    expect(results).toHaveLength(1);
  });

  it("returns results for all commands", async () => {
    const results = await runValidations(["echo a", "echo b", "echo c"], process.cwd());
    expect(results).toHaveLength(3);
  });

  it("uses Promise.all for parallel execution", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/validation.ts", "utf8");
    expect(src).toContain("Promise.all");
  });

  it("uses execFile (not exec) to avoid shell injection", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/validation.ts", "utf8");
    expect(src).toContain("execFile");
    expect(src).not.toMatch(/\bexec\(/);
  });

  it("each result preserves its command string", async () => {
    const results = await runValidations(["echo a", "echo b"], process.cwd());
    const commands = results.map((r) => r.command);
    expect(commands).toContain("echo a");
    expect(commands).toContain("echo b");
  });
});
