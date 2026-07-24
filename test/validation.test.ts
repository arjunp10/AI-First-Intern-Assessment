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
    // With exec (shell), this would run node -e "process.exit(1)" and exit non-zero.
    // With execFile, echo receives the semicolon as a literal arg and succeeds.
    const result = await runValidation('echo hello; node -e "process.exit(1)"', process.cwd());
    expect(result.status).toBe("passed");
  });

  it("runValidations uses Promise.all (parallel execution)", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/validation.ts", "utf8");
    expect(src).toContain("Promise.all");
  });
});
