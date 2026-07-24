import { describe, expect, it } from "vitest";

describe("mcp-server source contract", () => {
  it("reads repo_path from input (not repoPath)", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/mcp-server.ts", "utf8");
    expect(src).toContain("repo_path");
    expect(src).not.toContain("input.repoPath");
  });

  it("does not use 'any' type for handler input", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/mcp-server.ts", "utf8");
    expect(src).not.toContain("input: any");
  });

  it("includes error handling in the handler", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/mcp-server.ts", "utf8");
    expect(src).toContain("isError");
    expect(src).toContain("try");
  });
});
