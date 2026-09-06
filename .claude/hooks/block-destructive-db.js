#!/usr/bin/env node
// PreToolUse hook (Bash): denies commands that look like destructive
// database operations (resets, drops, force pushes) so they require the
// user to run them manually instead of being executed automatically.
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let command = "";
  try {
    const data = JSON.parse(input);
    command = data.tool_input?.command || "";
  } catch {
    return;
  }
  if (!command) return;

  const dangerousPatterns = [
    /prisma\s+migrate\s+reset/i,
    /prisma\s+db\s+push\s+.*--force-reset/i,
    /db\.dropDatabase\s*\(/i,
    /db\.[A-Za-z0-9_]+\.drop\s*\(/i,
    /\bdrop\s*database\b/i,
    /\bdrop\s*collection\b/i,
    /mongosh\b.*--eval\b.*drop/i,
  ];

  const match = dangerousPatterns.find((re) => re.test(command));
  if (match) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "Blocked: this looks like a destructive database command (reset/drop). Run it manually if you really intend to.",
        },
      }),
    );
  }
});
