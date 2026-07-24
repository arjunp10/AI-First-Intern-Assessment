import { describe, expect, it } from "vitest";
import { parseDiffLine } from "../src/git.js";

describe("parseDiffLine", () => {
  // Basic status codes
  it("parses added file", () => {
    expect(parseDiffLine("A\tsrc/new.ts")).toEqual({ path: "src/new.ts", status: "added" });
  });

  it("parses deleted file", () => {
    expect(parseDiffLine("D\tsrc/old.ts")).toEqual({ path: "src/old.ts", status: "deleted" });
  });

  it("parses modified file", () => {
    expect(parseDiffLine("M\tsrc/foo.ts")).toEqual({ path: "src/foo.ts", status: "modified" });
  });

  it("parses renamed file — uses new path", () => {
    expect(parseDiffLine("R100\told.ts\tnew.ts")).toEqual({ path: "new.ts", status: "modified" });
  });

  it("parses copied file — uses new path", () => {
    expect(parseDiffLine("C100\torig.ts\tcopy.ts")).toEqual({ path: "copy.ts", status: "added" });
  });

  it("returns empty path string for malformed line with no tab", () => {
    const result = parseDiffLine("M");
    expect(result.status).toBe("modified");
    expect(result.path).toBe("");
  });

  // Added paths
  it("parses added file with nested path", () => {
    expect(parseDiffLine("A\tsrc/a/b/c.ts")).toEqual({ path: "src/a/b/c.ts", status: "added" });
  });

  it("parses added dotfile", () => {
    expect(parseDiffLine("A\t.env.example")).toEqual({ path: ".env.example", status: "added" });
  });

  it("parses added file in root (no directory)", () => {
    expect(parseDiffLine("A\tREADME.md")).toEqual({ path: "README.md", status: "added" });
  });

  // Deleted paths
  it("parses deleted file with nested path", () => {
    expect(parseDiffLine("D\tsrc/utils/helper.ts")).toEqual({ path: "src/utils/helper.ts", status: "deleted" });
  });

  it("parses deleted TypeScript declaration file", () => {
    expect(parseDiffLine("D\tdist/index.d.ts")).toEqual({ path: "dist/index.d.ts", status: "deleted" });
  });

  // Modified paths
  it("parses modified file with deeply nested path", () => {
    expect(parseDiffLine("M\tsrc/a/b/c/d.ts")).toEqual({ path: "src/a/b/c/d.ts", status: "modified" });
  });

  it("parses modified JSON file", () => {
    expect(parseDiffLine("M\tpackage.json")).toEqual({ path: "package.json", status: "modified" });
  });

  it("parses modified file with numbers in path", () => {
    expect(parseDiffLine("M\tsrc/v2/handler.ts")).toEqual({ path: "src/v2/handler.ts", status: "modified" });
  });

  // Rename variations
  it("parses R050 (partial rename similarity)", () => {
    expect(parseDiffLine("R050\told.ts\tnew.ts")).toEqual({ path: "new.ts", status: "modified" });
  });

  it("parses R000 (zero similarity rename)", () => {
    expect(parseDiffLine("R000\told.ts\tnew.ts")).toEqual({ path: "new.ts", status: "modified" });
  });

  it("renamed file always has 'modified' status", () => {
    expect(parseDiffLine("R100\ta.ts\tb.ts").status).toBe("modified");
  });

  it("renamed file uses the second (new) path, not the first", () => {
    const result = parseDiffLine("R100\told-name.ts\tnew-name.ts");
    expect(result.path).toBe("new-name.ts");
    expect(result.path).not.toBe("old-name.ts");
  });

  it("rename with nested new path", () => {
    expect(parseDiffLine("R100\tsrc/old.ts\tsrc/renamed/new.ts")).toEqual({
      path: "src/renamed/new.ts",
      status: "modified",
    });
  });

  // Copy variations
  it("parses C050 (partial copy similarity)", () => {
    expect(parseDiffLine("C050\torig.ts\tcopy.ts")).toEqual({ path: "copy.ts", status: "added" });
  });

  it("copied file always has 'added' status", () => {
    expect(parseDiffLine("C100\ta.ts\tb.ts").status).toBe("added");
  });

  it("copied file uses the second (destination) path", () => {
    const result = parseDiffLine("C100\tsrc/orig.ts\tsrc/copy.ts");
    expect(result.path).toBe("src/copy.ts");
  });

  // Unknown/edge status codes
  it("unknown status code defaults to 'modified'", () => {
    expect(parseDiffLine("X\tsome.ts").status).toBe("modified");
  });

  it("returns a ChangedFile with both path and status properties", () => {
    const result = parseDiffLine("M\tfile.ts");
    expect(result).toHaveProperty("path");
    expect(result).toHaveProperty("status");
  });

  it("status is one of the valid values", () => {
    const validStatuses = ["added", "modified", "deleted"];
    expect(validStatuses).toContain(parseDiffLine("A\tf.ts").status);
    expect(validStatuses).toContain(parseDiffLine("M\tf.ts").status);
    expect(validStatuses).toContain(parseDiffLine("D\tf.ts").status);
  });
});
