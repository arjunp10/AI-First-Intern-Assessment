import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

// Returns a tilde fence guaranteed longer than any run of tildes in `content`,
// so arbitrary command output (which may itself contain ``` or ~~~) can never
// close the code block early. See CommonMark fenced-code-block rules.
function fenceFor(content: string): string {
  const runs = content.match(/~+/g) ?? [];
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
  return "~".repeat(Math.max(3, longest + 1));
}

export function markdownReport(input: ReportInput): string {
  const lines = [`# Review Report: ${input.repositoryPath}`, "", "## Changed files"];

  if (input.changedFiles.length === 0) {
    lines.push("No changed files detected.");
  } else {
    for (const file of input.changedFiles) {
      lines.push(`- ${file.path} (${file.status})`);
    }
  }

  lines.push("", "## Validation output");

  if (input.validationResults.length === 0) {
    lines.push("No validation commands were run.");
  } else {
    for (const result of input.validationResults) {
      const label = result.status === "failed" ? "FAILED" : "passed";
      const fence = fenceFor(result.output);
      lines.push(`### ${result.command} — ${label}`, fence, result.output, fence);
    }
  }

  return lines.join("\n");
}

export function jsonReport(input: ReportInput): string {
  return JSON.stringify(
    {
      repositoryPath: input.repositoryPath,
      changedFiles: input.changedFiles,
      validationResults: input.validationResults,
    },
    null,
    2,
  );
}
