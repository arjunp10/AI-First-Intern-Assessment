import { describe, expect, it } from "vitest";

describe("mcp-server input mapping", () => {
  it("reads repo_path not repoPath from input", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/mcp-server.ts", "utf8");
    expect(src).toContain("input.repo_path");
    expect(src).not.toContain("input.repoPath");
  });
});
