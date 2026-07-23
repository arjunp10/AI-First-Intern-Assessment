# Submission

## What did you investigate first, and why?

I read all six source files and the single existing test before touching anything. The goal was to understand the full surface area before prioritizing — a correctness bug in MCP is worse than a cosmetic gap in the report, so I needed to see everything first.

The MCP server was the first thing I looked at because the README explicitly calls it out as a production interface to evaluate. That's where I found the most critical bug: a field name mismatch that made MCP completely non-functional.

## What did you choose to implement or fix?

Six bugs, in priority order:

1. **MCP `repo_path` key mismatch** — handler read `input.repoPath` but schema declared `repo_path`. MCP was entirely broken.
2. **Validation failures crashed the run** — non-zero exit codes caused `reject(error)` instead of recording `status: "failed"`.
3. **Renamed/copied files produced garbled paths** — `R100\told\tnew` lines were joined into one path string instead of extracting the new path.
4. **Git errors had no context** — raw `execFileSync` throws gave no indication of which repo or command failed.
5. **Repo paths with spaces were silently truncated** — `.split(" ")[0]` in the CLI arg parser.
6. **Report sections were misleading when empty** — blank sections with no message; failed validations looked identical to passing ones.

For each fix I wrote a failing test first, then fixed the code, then verified with `npm test` and `npm run typecheck` before committing.

## What did you intentionally not do?

- **JSON output format**: The CLI accepts `--format json` but `core.ts` always returns Markdown regardless. Wiring this up would require a format parameter flowing through core and report — reasonable scope but lower priority than correctness bugs.
- **Input validation / path traversal hardening**: The tool trusts its caller entirely (appropriate for a local dev tool). A production networked deployment would need path allowlisting and command validation.
- **Streaming output for large diffs**: For repos with thousands of changed files the report could be very large. Not a problem at current scale.
- **Parallel validation execution**: Validations run sequentially. Parallelizing is straightforward but wasn't needed for correctness.

## Interface decision

- **Decision:** Hybrid — CLI-first, MCP as secondary interface
- **Primary user and execution environment:** Developers running the tool locally from a terminal (CLI), and AI coding agents such as Claude Code invoking it via MCP stdio. Both are real use cases served by different adapters.
- **Trust boundary and allowed capabilities:** Both interfaces run with full local user trust — any path the user can read and any command they can run. Appropriate for a local dev tool; would need hardening for multi-tenant or networked deployment.
- **Reliability, discoverability, latency/context, and output tradeoffs:** CLI writes a file on disk (easy to diff, scriptable in CI, zero extra setup). MCP returns the report inline in the tool response so an AI agent can act on it without parsing a file — better for agentic workflows but requires the MCP server to be running. Both share `core.ts` so there is no behavioral drift between them.
- **How supported interfaces remain consistent:** Both adapters call `reviewRepository()` from `src/core.ts` with the same `ReviewRequest` type. A change to core is reflected in both interfaces automatically.
- **Evidence that would change this decision:** If telemetry showed zero CLI usage and all calls came through MCP, I would drop the CLI adapter and invest in richer structured output (JSON + Markdown) from the MCP tool. If the tool were used exclusively in CI scripts with no AI client, I would drop the MCP server.

## How did you use an AI coding agent?

I used Claude Code (Claude Sonnet 4.6) throughout. It read all source files, identified the six bugs, wrote the implementation plan, and produced all the fixes and tests. I directed the order of work, reviewed each change before it was committed, and verified every test run myself.

## Where did you check, correct, or reject an AI suggestion? (required)

When fixing `git.ts`, the AI initially suggested wrapping the entire `changedFiles` function body in a broad try/catch that silently returns `[]` on any error. I rejected this. Silently returning an empty list when git fails (e.g. base ref not found, repo path wrong) would make the tool appear to succeed with zero changes — the caller gets no signal that something went wrong. I replaced it with a narrower try/catch around only the `execFileSync` call that re-throws with a descriptive message including the repo path, so failures surface clearly.

## Commands used to verify the result, with outcomes

```
npm run typecheck   # 0 errors
npm test            # 15 tests, 5 files, all passed
```

Run after every individual fix and again after all fixes were complete.

## A blocker you hit and how you approached it

The subagent dispatch I tried for parallelizing the fixes couldn't get tool permissions in the sandboxed environment. Rather than spending time debugging the harness, I switched to inline implementation — the tasks were well-specified enough that direct implementation was equally fast and let me review each change immediately.

## Known limitations and the next three things you would do

1. **Wire up `--format json`**: The CLI flag is parsed but ignored — `core.ts` always returns Markdown. Adding a `format` parameter to `ReviewRequest` and a `jsonReport()` function in `report.ts` would complete the contract.
2. **Add an integration test for the full CLI flow**: The current tests are unit tests. An integration test that runs `npm run inspector -- review --repo . --base-ref HEAD~1` and checks the output file would catch adapter-level regressions.
3. **Harden MCP input validation**: `repo_path` is accepted as any string. Adding a check that the path exists and is a git repository before calling `reviewRepository` would give MCP callers a clean error instead of a raw exception.

## Approximate focused-work time

- Start: 2026-07-23 19:30
- Finish: 2026-07-23 20:00
