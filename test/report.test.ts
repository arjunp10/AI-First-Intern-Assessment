import { describe, expect, it } from "vitest";
import { jsonReport, markdownReport } from "../src/report.js";

describe("markdownReport", () => {
  it("lists changed files and validation output", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [{ path: "src/index.ts", status: "modified" }],
      validationResults: [{ command: "npm test", status: "passed", output: "ok" }],
    });

    expect(report).toContain("src/index.ts (modified)");
    expect(report).toContain("npm test");
    expect(report).toContain("ok");
  });

  it("shows a no-changes message when changedFiles is empty", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: [],
    });
    expect(report).toContain("No changed files");
  });

  it("marks failed validations clearly", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "failed", output: "1 test failed" }],
    });
    expect(report).toContain("FAILED");
    expect(report).toContain("1 test failed");
  });

  it("uses tilde fences so backtick sequences in output don't break the block", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "passed", output: "result with ``` in it" }],
    });
    expect(report).toContain("result with ``` in it");
    expect(report).toContain("~~~");
  });
});

describe("jsonReport", () => {
  it("returns valid JSON with all fields", () => {
    const report = jsonReport({
      repositoryPath: "/work/sample",
      changedFiles: [{ path: "src/index.ts", status: "modified" }],
      validationResults: [{ command: "npm test", status: "passed", output: "ok" }],
    });
    const parsed = JSON.parse(report);
    expect(parsed.repositoryPath).toBe("/work/sample");
    expect(parsed.changedFiles).toHaveLength(1);
    expect(parsed.validationResults[0].status).toBe("passed");
  });
});