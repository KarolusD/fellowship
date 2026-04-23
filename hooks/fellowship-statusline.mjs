#!/usr/bin/env node
// Fellowship statusLine hook
// Fires after every tool use. Reads context window data from stdin and outputs
// a status line for the user's status bar.
//
// Data flow note: this hook is purely for display. The context-monitor
// PostToolUse hook reads context_window.remaining_percentage directly from
// its own stdin input — no shared file, no IPC between the two hooks.

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
    const remaining = data.context_window?.remaining_percentage;

    // No context data available — exit silently
    if (remaining == null) {
      process.exit(0);
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
