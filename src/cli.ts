#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { reviewRepository } from "./core.js";

type Args = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  format?: "markdown" | "json";
  validations: string[];
};

const VALUE_FLAGS = new Set(["--repo", "--base-ref", "--format", "--validate"]);

export function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? "", validations: [] };
  for (let index = 1; index < argv.length; index++) {
    const token = argv[index];
    if (!VALUE_FLAGS.has(token)) continue;
    // A value flag at the end of argv has no following value; skip it rather
    // than storing undefined (which would violate the string types).
    if (index + 1 >= argv.length) continue;
    const value = argv[++index];
    if (token === "--repo") {
      args.repositoryPath = value;
    } else if (token === "--base-ref") {
      args.baseRef = value;
    } else if (token === "--format") {
      args.format = value as Args["format"];
    } else if (token === "--validate") {
      args.validations.push(value);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== "review" || !args.repositoryPath) {
    console.error("Usage: inspector review --repo <path> [--base-ref <ref>] [--validate <command>]");
    process.exitCode = 1;
    return;
  }

  const report = await reviewRepository({
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    validationCommands: args.validations,
    format: args.format,
  });
  writeFileSync("review-report.md", report, "utf8");
  console.log("Review report written to review-report.md");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
