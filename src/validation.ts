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

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const [file, ...args] = splitCommand(command);
    execFile(file, args, { cwd }, (error, stdout, stderr) => {
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
