import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

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
      lines.push(`### ${result.command} — ${label}`, "```", result.output, "```");
    }
  }

  return lines.join("\n");
}
