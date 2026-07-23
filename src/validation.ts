import { exec } from "node:child_process";
import type { ValidationResult } from "./types.js";

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        resolve({ command, status: "failed", output: stderr || stdout || error.message });
        return;
      }
      resolve({ command, status: "passed", output: stdout || stderr });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}
