import { describe, expect, it } from "vitest";
import { parseDiffLine } from "../src/git.js";

describe("parseDiffLine", () => {
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
});
