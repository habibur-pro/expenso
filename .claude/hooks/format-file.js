#!/usr/bin/env node
// PostToolUse hook (Write|Edit): formats the file Claude just wrote/edited
// with Prettier. Never blocks the agent — formatting failures are swallowed.
const { execFileSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath;
  try {
    const data = JSON.parse(input);
    filePath = data.tool_input?.file_path || data.tool_response?.filePath;
  } catch {
    return;
  }
  if (!filePath) return;

  try {
    // Invoke prettier's CLI script directly via node instead of "npx" —
    // avoids shell:true (arg-escaping risk) and npx.cmd resolution issues
    // on Windows (execFileSync doesn't do PATHEXT lookup).
    const prettierCli = require.resolve("prettier/bin/prettier.cjs");
    execFileSync(process.execPath, [prettierCli, "--ignore-unknown", "--write", filePath], {
      stdio: "ignore",
    });
  } catch {
    // Ignore: an unformattable/unsupported file should never break the turn.
  }
});
