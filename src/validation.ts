import { execFile } from "node:child_process";
import type { ValidationResult } from "./types.js";

// Splits a command string into [binary, ...args] without invoking a shell.
// Handles single quotes, double quotes, and backslash escapes.
// Shell metacharacters (;, &&, |, $()) are treated as literals, preventing injection.
function splitCommand(command: string): [string, ...string[]] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (inSingle) {
      if (ch === "'") inSingle = false;
      else current += ch;
    } else if (inDouble) {
      if (ch === '"') inDouble = false;
      else if (ch === "\\" && i + 1 < command.length) current += command[++i];
      else current += ch;
    } else if (ch === "'") {
      inSingle = true;
    } else if (ch === '"') {
      inDouble = true;
    } else if (ch === "\\" && i + 1 < command.length) {
      current += command[++i];
    } else if (ch === " " || ch === "\t") {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  if (tokens.length === 0) throw new Error(`Empty validation command`);
  return tokens as [string, ...string[]];
}

// Allow up to 50MB of captured output so verbose but passing suites (e.g. npm
// test) aren't falsely reported as failed by execFile's 1MB default maxBuffer.
const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    let file: string;
    let args: string[];
    try {
      [file, ...args] = splitCommand(command);
    } catch (err) {
      // A malformed command must be reported, not crash the whole run.
      const message = err instanceof Error ? err.message : String(err);
      resolve({ command, status: "failed", output: message });
      return;
    }
    execFile(file, args, { cwd, maxBuffer: MAX_OUTPUT_BYTES }, (error, stdout, stderr) => {
      if (error) {
        resolve({ command, status: "failed", output: stderr || stdout || error.message });
        return;
      }
      resolve({ command, status: "passed", output: stdout || stderr });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  return Promise.all(commands.map((command) => runValidation(command, cwd)));
}
