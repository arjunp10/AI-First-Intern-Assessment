#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { reviewRepository } from "./core.js";

const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

server.tool(
  "review_repository",
  "Inspects a Git repository and returns a review report of changed files and validation results.",
  {
    repo_path: z.string().describe("Absolute path to the Git repository to inspect."),
    base_ref: z.string().optional().describe("Git ref to diff against (defaults to main)."),
    validation_commands: z
      .array(z.string())
      .optional()
      .describe("Commands to run as validation checks, e.g. ['npm test', 'npm run lint']."),
    format: z
      .enum(["markdown", "json"])
      .optional()
      .describe("Output format: 'markdown' (default) or 'json'."),
  },
  async ({ repo_path, base_ref, validation_commands, format }) => {
    try {
      const report = await reviewRepository({
        repositoryPath: repo_path,
        baseRef: base_ref,
        validationCommands: validation_commands,
        format,
      });
      return { content: [{ type: "text" as const, text: report }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

await server.connect(new StdioServerTransport());
