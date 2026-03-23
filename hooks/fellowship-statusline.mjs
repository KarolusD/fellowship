#!/usr/bin/env node
// Fellowship statusLine hook
// Fires after every tool use. Receives context window data, writes bridge file
// for the context-monitor PostToolUse hook, and outputs a status line for the
// user's status bar.

import fs from 'fs';
import path from 'path';
import os from 'os';

let input = '';
// Timeout guard: if stdin doesn't close within 10s (e.g. pipe issues on
// Windows/Git Bash, or slow Claude Code piping during large outputs),
// exit silently instead of hanging until Claude Code kills the process
// and reports "hook error". See gsd #775, #1162.
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    const remaining = data.context_window?.remaining_percentage;

    // No context data available — exit silently
    if (remaining == null) {
      process.exit(0);
    }

    // Write bridge file for fellowship-context-monitor PostToolUse hook
    if (sessionId) {
      try {
        const bridgePath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
        const used = Math.round(100 - remaining);
        fs.writeFileSync(bridgePath, JSON.stringify({
          session_id: sessionId,
          remaining_percentage: remaining,
          used_pct: used,
          timestamp: Math.floor(Date.now() / 1000)
        }));
      } catch (e) {
        // Silent fail — bridge is best-effort, don't break statusline
      }
    }

    // Output status line with color indicator
    const r = Math.round(remaining);
    let indicator;
    if (r > 50) {
      indicator = `\u{1F7E2} ctx: ${r}%`;
    } else if (r > 35) {
      indicator = `\u{1F7E1} ctx: ${r}%`;
    } else if (r > 25) {
      indicator = `\u{1F7E0} ctx: ${r}%`;
    } else {
      indicator = `\u{1F534} ctx: ${r}%`;
    }

    process.stdout.write(indicator);
  } catch (e) {
    // Silent fail — never break statusline
    process.exit(0);
  }
});
