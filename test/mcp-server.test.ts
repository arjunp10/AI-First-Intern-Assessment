import { describe, expect, it } from "vitest";

async function readMcpSource() {
  const fs = await import("node:fs/promises");
  return fs.readFile("src/mcp-server.ts", "utf8");
}

describe("mcp-server source contract", () => {
  it("reads repo_path from input (not repoPath)", async () => {
    const src = await readMcpSource();
    expect(src).toContain("repo_path");
    expect(src).not.toContain("input.repoPath");
  });

  it("does not use 'any' type for handler input", async () => {
    const src = await readMcpSource();
    expect(src).not.toContain("input: any");
  });

  it("includes error handling in the handler", async () => {
    const src = await readMcpSource();
    expect(src).toContain("isError");
    expect(src).toContain("try");
  });

  it("has a catch block for error handling", async () => {
    const src = await readMcpSource();
    expect(src).toContain("catch");
  });

  it("has .describe() on at least one parameter", async () => {
    const src = await readMcpSource();
    expect(src).toContain(".describe(");
  });

  it("uses the server name 'repository-inspector'", async () => {
    const src = await readMcpSource();
    expect(src).toContain("repository-inspector");
  });

  it("exposes the review_repository tool", async () => {
    const src = await readMcpSource();
    expect(src).toContain("review_repository");
  });
});
