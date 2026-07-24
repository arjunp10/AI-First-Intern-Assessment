import { describe, expect, it } from "vitest";
import { jsonReport, markdownReport } from "../src/report.js";

const sampleInput = {
  repositoryPath: "/work/sample",
  changedFiles: [{ path: "src/index.ts", status: "modified" as const }],
  validationResults: [{ command: "npm test", status: "passed" as const, output: "ok" }],
};

describe("markdownReport", () => {
  it("lists changed files and validation output", () => {
    const report = markdownReport(sampleInput);
    expect(report).toContain("src/index.ts (modified)");
    expect(report).toContain("npm test");
    expect(report).toContain("ok");
  });

  it("shows a no-changes message when changedFiles is empty", () => {
    const report = markdownReport({ ...sampleInput, changedFiles: [] });
    expect(report).toContain("No changed files");
  });

  it("marks failed validations clearly", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "failed", output: "1 test failed" }],
    });
    expect(report).toContain("FAILED");
    expect(report).toContain("1 test failed");
  });

  it("uses tilde fences so backtick sequences in output don't break the block", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "passed", output: "result with ``` in it" }],
    });
    expect(report).toContain("result with ``` in it");
    expect(report).toContain("~~~");
  });

  it("starts with a level-1 heading", () => {
    const report = markdownReport(sampleInput);
    expect(report.startsWith("# Review Report:")).toBe(true);
  });

  it("includes the repository path in the heading", () => {
    const report = markdownReport({ ...sampleInput, repositoryPath: "/my/special/repo" });
    expect(report).toContain("/my/special/repo");
  });

  it("always includes the Changed files section header", () => {
    const report = markdownReport({ ...sampleInput, changedFiles: [] });
    expect(report).toContain("## Changed files");
  });

  it("always includes the Validation output section header", () => {
    const report = markdownReport({ ...sampleInput, validationResults: [] });
    expect(report).toContain("## Validation output");
  });

  it("shows added status in parentheses", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [{ path: "new.ts", status: "added" }],
    });
    expect(report).toContain("new.ts (added)");
  });

  it("shows deleted status in parentheses", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [{ path: "old.ts", status: "deleted" }],
    });
    expect(report).toContain("old.ts (deleted)");
  });

  it("lists all changed files when there are multiple", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [
        { path: "a.ts", status: "added" },
        { path: "b.ts", status: "modified" },
        { path: "c.ts", status: "deleted" },
      ],
    });
    expect(report).toContain("a.ts");
    expect(report).toContain("b.ts");
    expect(report).toContain("c.ts");
  });

  it("preserves file path with spaces", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [{ path: "my folder/file.ts", status: "modified" }],
    });
    expect(report).toContain("my folder/file.ts");
  });

  it("preserves deeply nested path", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [{ path: "src/a/b/c/deep.ts", status: "added" }],
    });
    expect(report).toContain("src/a/b/c/deep.ts");
  });

  it("shows 'No validation commands were run' when validationResults is empty", () => {
    const report = markdownReport({ ...sampleInput, validationResults: [] });
    expect(report).toContain("No validation commands were run");
  });

  it("shows 'passed' label for a passing validation", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "passed", output: "ok" }],
    });
    expect(report).toContain("— passed");
  });

  it("includes all validation commands when there are multiple", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [
        { command: "npm test", status: "passed", output: "ok" },
        { command: "npm run lint", status: "failed", output: "errors" },
      ],
    });
    expect(report).toContain("npm test");
    expect(report).toContain("npm run lint");
  });

  it("does not use backtick fences for validation output", () => {
    const report = markdownReport(sampleInput);
    expect(report).not.toMatch(/^```/m);
  });

  it("returns a non-empty string", () => {
    const report = markdownReport(sampleInput);
    expect(report.length).toBeGreaterThan(0);
  });

  it("empty validation output renders without breaking", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [{ command: "true", status: "passed", output: "" }],
    });
    expect(report).toContain("true");
  });

  it("mixed passed and failed results both show correct labels", () => {
    const report = markdownReport({
      ...sampleInput,
      changedFiles: [],
      validationResults: [
        { command: "cmd1", status: "passed", output: "" },
        { command: "cmd2", status: "failed", output: "" },
      ],
    });
    expect(report).toContain("cmd1 — passed");
    expect(report).toContain("cmd2 — FAILED");
  });

  it("handles repo path with special characters", () => {
    const report = markdownReport({ ...sampleInput, repositoryPath: "/path/to/my-repo_v2" });
    expect(report).toContain("/path/to/my-repo_v2");
  });
});

describe("jsonReport", () => {
  it("returns valid JSON with all fields", () => {
    const report = jsonReport(sampleInput);
    const parsed = JSON.parse(report);
    expect(parsed.repositoryPath).toBe("/work/sample");
    expect(parsed.changedFiles).toHaveLength(1);
    expect(parsed.validationResults[0].status).toBe("passed");
  });

  it("repositoryPath matches input exactly", () => {
    const report = jsonReport({ ...sampleInput, repositoryPath: "/exact/path" });
    expect(JSON.parse(report).repositoryPath).toBe("/exact/path");
  });

  it("changedFiles is an array", () => {
    expect(Array.isArray(JSON.parse(jsonReport(sampleInput)).changedFiles)).toBe(true);
  });

  it("validationResults is an array", () => {
    expect(Array.isArray(JSON.parse(jsonReport(sampleInput)).validationResults)).toBe(true);
  });

  it("changedFiles is empty array when no files", () => {
    const report = jsonReport({ ...sampleInput, changedFiles: [] });
    expect(JSON.parse(report).changedFiles).toEqual([]);
  });

  it("validationResults is empty array when no validations", () => {
    const report = jsonReport({ ...sampleInput, validationResults: [] });
    expect(JSON.parse(report).validationResults).toEqual([]);
  });

  it("changedFile entry has path field", () => {
    const parsed = JSON.parse(jsonReport(sampleInput));
    expect(parsed.changedFiles[0]).toHaveProperty("path");
  });

  it("changedFile entry has status field", () => {
    const parsed = JSON.parse(jsonReport(sampleInput));
    expect(parsed.changedFiles[0]).toHaveProperty("status");
  });

  it("validationResult has command, status, and output fields", () => {
    const parsed = JSON.parse(jsonReport(sampleInput));
    const result = parsed.validationResults[0];
    expect(result).toHaveProperty("command");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("output");
  });

  it("output is pretty-printed with indentation", () => {
    const report = jsonReport(sampleInput);
    expect(report).toContain("\n  ");
  });
});
