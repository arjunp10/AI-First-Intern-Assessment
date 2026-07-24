import { execFileSync } from "node:child_process";
import type { ChangedFile } from "./types.js";

function git(repositoryPath: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryPath,
      encoding: "utf8",
    }).trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`git command failed in ${repositoryPath}: ${msg}`);
  }
}

export function parseDiffLine(line: string): ChangedFile {
  const parts = line.split("\t");
  const code = parts[0] ?? "";
  if (code.startsWith("R") || code.startsWith("C")) {
    const newPath = parts[2] ?? parts[1] ?? "";
    const status = code.startsWith("C") ? "added" : "modified";
    return { path: newPath, status };
  }
  const status = code === "A" ? "added" : code === "D" ? "deleted" : "modified";
  return { path: parts[1] ?? "", status };
}

export function changedFiles(repositoryPath: string, baseRef?: string): ChangedFile[] {
  const base = baseRef ?? "main";
  const output = git(repositoryPath, ["diff", "--name-status", `${base}...HEAD`]);
  return output.split("\n").filter(Boolean).map(parseDiffLine);
}
