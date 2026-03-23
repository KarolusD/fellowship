#!/usr/bin/env node
// Fellowship context monitor - PostToolUse hook
// Reads context metrics from the statusline bridge file and injects
// warnings into the agent's conversation when context usage is high.
//
// How it works:
// 1. The statusline hook writes metrics to /tmp/claude-ctx-{session_id}.json
// 2. This hook reads those metrics after each tool use
// 3. When remaining context drops below thresholds, it injects a warning
//    as additionalContext, which the agent sees in its conversation
//
// Thresholds:
//   WARNING  (remaining <= 35%): Agent should wrap up current task
//   CRITICAL (remaining <= 25%): Agent should stop immediately and save state
//
// Debounce: 5 tool uses between warnings to avoid spam
// Severity escalation bypasses debounce (WARNING -> CRITICAL fires immediately)

import fs from 'fs';
import os from 'os';

const WARNING_THRESHOLD = 35;  // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
const STALE_SECONDS = 60;      // ignore metrics older than 60s
const DEBOUNCE_CALLS = 5;      // min tool uses between warnings

let input = '';
// Timeout guard: if stdin doesn't close within 10s (e.g. pipe issues on
// Windows/Git Bash, or slow Claude Code piping during large outputs),
// exit silently instead of hanging. See gsd #775, #1162.
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;

    if (!sessionId) {
      process.exit(0);
    }

    // Try to read remaining_percentage directly from hook input first
    // (avoids bridge file round-trip when context data is directly available)
    let remaining = data.context_window?.remaining_percentage ?? null;

    if (remaining == null) {
      // Fall back to bridge file written by statusline hook
      const tmpDir = os.tmpdir();
      const metricsPath = `${tmpDir}/claude-ctx-${sessionId}.json`;

      // No bridge file — subagent or no statusline running, exit silently
      if (!fs.existsSync(metricsPath)) {
        process.exit(0);
      }

      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      const now = Math.floor(Date.now() / 1000);

      // Stale metrics — exit silently
      if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
        process.exit(0);
      }

      remaining = metrics.remaining_percentage;
    }

    // No warning needed
    if (remaining > WARNING_THRESHOLD) {
      process.exit(0);
    }

    // Debounce: check if we warned recently
    const tmpDir = os.tmpdir();
    const warnPath = `${tmpDir}/claude-ctx-${sessionId}-warned.json`;
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;

    if (fs.existsSync(warnPath)) {
      try {
        warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
        firstWarn = false;
      } catch (e) {
        // Corrupted file, reset
      }
    }

    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';

    // Emit immediately on first warning, then debounce subsequent ones.
    // Severity escalation (WARNING -> CRITICAL) bypasses debounce.
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      // Update counter and exit without warning
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }

    // Reset debounce counter
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    // Build warning message
    let message;
    if (isCritical) {
      message = `\u{1F6A8} CONTEXT CRITICAL (${remaining}% remaining): Context window is nearly exhausted. Stop new work immediately. Write your current progress and state to a file. Report back to Gandalf with what's done and what remains.`;
    } else {
      message = `\u26A0\uFE0F CONTEXT WARNING (${remaining}% remaining): Context window is getting full. Avoid starting new complex work. Finish what's in progress or save state to a file before the window closes.`;
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});
