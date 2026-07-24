# Submission

## What did you investigate first, and why?

I read all six source files and the single existing test before touching anything. The goal was to understand the full surface area before prioritizing — a correctness bug in MCP is worse than a cosmetic gap in the report, so I needed to see everything first.

The MCP server was the first thing I looked at because the README explicitly calls it out as a production interface to evaluate. That's where I found the most critical bug: a field name mismatch that made MCP completely non-functional.

## What did you choose to implement or fix?

Eleven bugs total, in priority order:

1. **MCP `repo_path` key mismatch** — handler read `input.repoPath` but schema declared `repo_path`. MCP was entirely broken.
2. **Validation failures crashed the run** — non-zero exit codes caused `reject(error)` instead of recording `status: "failed"`.
3. **Shell injection via `exec`** — `validation.ts` passed user-controlled `--validate` strings through `/bin/sh`, allowing metacharacters like `;` and `&&` to inject arbitrary commands. Replaced with `execFile` plus a minimal argv parser that handles quoted arguments without invoking a shell.
4. **Renamed/copied files produced garbled paths** — `R100\told\tnew` lines were joined into one path string. Extracted new path; exported `parseDiffLine` for unit testing.
5. **Git errors had no context** — raw `execFileSync` throws gave no indication of which repo or command failed.
6. **Repo paths with spaces were silently truncated** — `.split(" ")[0]` in the CLI arg parser.
7. **`format: "json"` silently ignored** — `ReviewRequest.format` was accepted but always produced Markdown. Implemented `jsonReport()` and wired the format parameter through `core.ts`.
8. **Backtick fences in report could be broken** — if validation output contained ` ``` `, the Markdown code block would be invalid. Switched to tilde fences (`~~~`) which are CommonMark-compliant and can contain backtick sequences.
9. **Dead `"untracked"` type** — `ChangedFile.status` included `"untracked"` which `git diff --name-status` never produces. Removed to prevent misleading type consumers.
10. **MCP handler `input: any`** — bypassed all type safety. Replaced with destructured typed parameters inferred from the Zod schema.
11. **No error handling in MCP handler** — exceptions from `reviewRepository` propagated raw to the MCP transport. Wrapped in try/catch returning `isError: true`.

Secondary improvements alongside the fixes:
- Added `.describe()` to all MCP tool parameters so AI agents can use them correctly.
- Changed sequential `runValidations` loop to `Promise.all` for parallel execution.
- Guarded `parseDiffLine` against undefined array parts on malformed diff lines.

For each fix: wrote a failing test first, fixed the code, verified with `npm test` and `npm run typecheck`, then committed.

## What did you intentionally not do?

- **Input validation / path traversal hardening**: The tool trusts its caller entirely (appropriate for a local dev tool). A production networked deployment would need path allowlisting.
- **Streaming output for large diffs**: Not a problem at current scale.
- **`--format` value validation in CLI**: An unrecognized format value defaults to Markdown at runtime, which is a reasonable silent fallback for a local tool.
- **Integration test for full CLI flow**: Unit tests cover each module. An end-to-end test would require a fixture repo and subprocess execution — useful but out of scope for the time budget.

## Interface decision

- **Decision:** Hybrid — CLI-first, MCP as secondary interface
- **Primary user and execution environment:** Developers running the tool locally from a terminal (CLI), and AI coding agents such as Claude Code invoking it via MCP stdio. Both are real use cases served by different adapters.
- **Trust boundary and allowed capabilities:** Both interfaces run with full local user trust — any path the user can read and any command they can run. The `execFile` fix reduces the injection surface but the tool is still fundamentally a trusted-caller tool. A production networked deployment would need path allowlisting and command validation.
- **Reliability, discoverability, latency/context, and output tradeoffs:** CLI writes a file on disk (easy to diff, scriptable in CI, zero extra setup). MCP returns the report inline in the tool response so an AI agent can act on it without parsing a file — better for agentic workflows but requires the MCP server to be running. Both share `core.ts` so there is no behavioral drift between them.
- **How supported interfaces remain consistent:** Both adapters call `reviewRepository()` from `src/core.ts` with the same `ReviewRequest` type. A change to core is reflected in both interfaces automatically. Both now also support `format: "json"`.
- **Evidence that would change this decision:** If telemetry showed zero CLI usage and all calls came through MCP, I would drop the CLI adapter and invest in richer structured output (JSON + Markdown) from the MCP tool. If the tool were used exclusively in CI scripts with no AI client, I would drop the MCP server.

## How did you use an AI coding agent?

I used Claude Code (Claude Sonnet 4.6) throughout. It read all source files, identified bugs, wrote the implementation plan, and produced all the fixes and tests. I directed the order of work, reviewed each change before it was committed, verified every test run, and caught additional bugs (shell injection, dead type, backtick fences) that the initial plan missed.

## Where did you check, correct, or reject an AI suggestion? (required)

When fixing `git.ts`, the AI initially suggested wrapping the entire `changedFiles` function body in a broad try/catch that silently returns `[]` on any error. I rejected this. Silently returning an empty list when git fails (e.g. base ref not found, repo path wrong) would make the tool appear to succeed with zero changes — the caller gets no signal that something went wrong. I replaced it with a narrower try/catch around only the `execFileSync` call that re-throws with a descriptive message including the repo path, so failures surface clearly.

## Commands used to verify the result, with outcomes

```
$ npm run typecheck
# exit 0, no output (zero errors)

$ npm test
# Test Files  5 passed (5)
#       Tests  107 passed (107)

$ npm run build
# exit 0, no output (clean compile to dist/)

$ npm run inspector -- review --repo . --validate "echo hello"
# Review report written to review-report.md
# (review-report.md contents:)
# # Review Report: .
# ## Changed files
# No changed files detected.
# ## Validation output
# ### echo hello — passed
# ~~~
# hello
# ~~~
```

Run after every individual fix and again after all fixes were complete.

## A blocker you hit and how you approached it

The subagent dispatch I tried for parallelizing the fixes couldn't get tool permissions in the sandboxed environment. Rather than spending time debugging the harness, I switched to inline implementation — the tasks were well-specified enough that direct implementation was equally fast and let me review each change immediately.

## Known limitations and the next three things you would do

1. **Add an integration test for the full CLI flow** — an end-to-end test that runs `npm run inspector -- review --repo . --base-ref HEAD~1` and checks the output file would catch adapter-level regressions that unit tests miss.
2. **Validate `--format` argument in CLI** — currently an unrecognized value silently defaults to Markdown. Should print an error and exit 1.
3. **MCP path existence check** — `repo_path` is accepted as any string; if the path doesn't exist or isn't a git repo, the error from `execFileSync` propagates as an uncontrolled exception even though the MCP handler now catches it. A pre-flight check with a clear error message would be better UX.

## Approximate focused-work time

- Start: 2026-07-23 19:30
- Finish: 2026-07-23 20:15
