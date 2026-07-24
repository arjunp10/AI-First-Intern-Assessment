import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  // Basic command parsing
  it("sets command from first argument", () => {
    expect(parseArgs(["review", "--repo", "/tmp"])).toMatchObject({ command: "review" });
  });

  it("empty argv gives empty command string", () => {
    expect(parseArgs([])).toMatchObject({ command: "" });
  });

  it("unknown command is stored as-is", () => {
    expect(parseArgs(["inspect"])).toMatchObject({ command: "inspect" });
  });

  // --repo
  it("captures --repo path", () => {
    expect(parseArgs(["review", "--repo", "/path/to/repo"])).toMatchObject({
      repositoryPath: "/path/to/repo",
    });
  });

  it("preserves spaces in --repo path", () => {
    const args = parseArgs(["review", "--repo", "/my projects/repo"]);
    expect(args.repositoryPath).toBe("/my projects/repo");
  });

  it("missing --repo leaves repositoryPath undefined", () => {
    expect(parseArgs(["review"]).repositoryPath).toBeUndefined();
  });

  it("--repo with dot path", () => {
    expect(parseArgs(["review", "--repo", "."])).toMatchObject({ repositoryPath: "." });
  });

  it("--repo with relative path", () => {
    expect(parseArgs(["review", "--repo", "../other-repo"])).toMatchObject({
      repositoryPath: "../other-repo",
    });
  });

  // --base-ref
  it("captures --base-ref", () => {
    expect(parseArgs(["review", "--repo", "/tmp/r", "--base-ref", "develop"])).toMatchObject({
      baseRef: "develop",
    });
  });

  it("missing --base-ref leaves baseRef undefined (not defaulted to main)", () => {
    expect(parseArgs(["review", "--repo", "/tmp/r"]).baseRef).toBeUndefined();
  });

  it("--base-ref can be a commit SHA", () => {
    expect(
      parseArgs(["review", "--repo", "/tmp/r", "--base-ref", "abc1234"]).baseRef,
    ).toBe("abc1234");
  });

  it("--base-ref can be HEAD~1", () => {
    expect(
      parseArgs(["review", "--repo", "/tmp/r", "--base-ref", "HEAD~1"]).baseRef,
    ).toBe("HEAD~1");
  });

  // --format
  it("captures --format markdown", () => {
    expect(parseArgs(["review", "--repo", "/tmp", "--format", "markdown"])).toMatchObject({
      format: "markdown",
    });
  });

  it("captures --format json", () => {
    expect(parseArgs(["review", "--repo", "/tmp", "--format", "json"])).toMatchObject({
      format: "json",
    });
  });

  it("missing --format leaves format undefined", () => {
    expect(parseArgs(["review", "--repo", "/tmp"]).format).toBeUndefined();
  });

  // --validate
  it("captures a single --validate flag", () => {
    expect(
      parseArgs(["review", "--repo", "/tmp", "--validate", "npm test"]).validations,
    ).toEqual(["npm test"]);
  });

  it("captures multiple --validate flags", () => {
    const args = parseArgs([
      "review", "--repo", "/tmp",
      "--validate", "npm test",
      "--validate", "npm run lint",
    ]);
    expect(args.validations).toEqual(["npm test", "npm run lint"]);
  });

  it("validations starts as empty array when no --validate flags", () => {
    expect(parseArgs(["review", "--repo", "/tmp"]).validations).toEqual([]);
  });

  it("captures three --validate flags", () => {
    const args = parseArgs([
      "review", "--repo", "/tmp",
      "--validate", "a",
      "--validate", "b",
      "--validate", "c",
    ]);
    expect(args.validations).toHaveLength(3);
  });

  it("--validate with complex command string preserved", () => {
    const args = parseArgs(["review", "--repo", "/tmp", "--validate", "node -e \"console.log(1)\""]);
    expect(args.validations[0]).toBe("node -e \"console.log(1)\"");
  });

  // Order independence
  it("--validate before --repo still works", () => {
    const args = parseArgs(["review", "--validate", "npm test", "--repo", "/tmp"]);
    expect(args.repositoryPath).toBe("/tmp");
    expect(args.validations).toEqual(["npm test"]);
  });

  it("--base-ref after --validate still works", () => {
    const args = parseArgs(["review", "--repo", "/tmp", "--validate", "x", "--base-ref", "dev"]);
    expect(args.baseRef).toBe("dev");
    expect(args.validations).toEqual(["x"]);
  });

  // Misc
  it("unknown flags are silently ignored", () => {
    const args = parseArgs(["review", "--repo", "/tmp", "--unknown", "value"]);
    expect(args.repositoryPath).toBe("/tmp");
  });

  it("command 'Review' (capital R) is not treated as 'review'", () => {
    expect(parseArgs(["Review", "--repo", "/tmp"]).command).toBe("Review");
  });

  it("--validate at end with no value does not push undefined", () => {
    const args = parseArgs(["review", "--repo", "/tmp", "--validate"]);
    expect(args.validations).toEqual([]);
  });

  it("--repo at end with no value leaves repositoryPath undefined", () => {
    const args = parseArgs(["review", "--repo"]);
    expect(args.repositoryPath).toBeUndefined();
  });

  it("unknown flag does not consume the following real flag", () => {
    const args = parseArgs(["review", "--unknown", "--repo", "/tmp"]);
    expect(args.repositoryPath).toBe("/tmp");
  });
});
