import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("preserves spaces in --repo path", () => {
    const args = parseArgs(["review", "--repo", "/my projects/repo"]);
    expect(args.repositoryPath).toBe("/my projects/repo");
  });

  it("captures --base-ref", () => {
    const args = parseArgs(["review", "--repo", "/tmp/r", "--base-ref", "develop"]);
    expect(args.baseRef).toBe("develop");
  });

  it("captures multiple --validate flags", () => {
    const args = parseArgs(["review", "--repo", "/tmp/r", "--validate", "npm test", "--validate", "npm run lint"]);
    expect(args.validations).toEqual(["npm test", "npm run lint"]);
  });
});
