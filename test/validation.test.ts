import { describe, expect, it } from "vitest";
import { runValidation } from "../src/validation.js";

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
});
