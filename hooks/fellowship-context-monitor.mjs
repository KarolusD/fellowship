#!/usr/bin/env node
// Fellowship context monitor - PostToolUse hook
// Monitors context usage and injects warnings when the window is getting full.
//
// How it works:
// 1. Reads remaining context directly from hook input (context_window.remaining_percentage)
// 2. Tracks warning state in environment variables (avoids filesystem I/O on hot path)
// 3. Emits warning when context crosses thresholds, with severity escalation
//
// Thresholds:
//   WARNING  (remaining <= 35%): Agent should wrap up current task
//   CRITICAL (remaining <= 25%): Agent should stop immediately and save state
//
// Debounce: Emits only on level change or escalation (WARNING -> CRITICAL)
// This keeps the hot path stateless and I/O-free.

const WARNING_THRESHOLD = 35;  // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%

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

    // Use context data already in hook input — avoids filesystem I/O on hot path
    const remaining = data.context_window?.remaining_percentage ?? null;

    // No context data available — exit silently
    if (remaining == null) {
      process.exit(0);
    }

    // No warning needed
    if (remaining > WARNING_THRESHOLD) {
      process.exit(0);
    }

    // Debounce: use environment variable to track previous level
    // This avoids file I/O on every tool use and keeps the interface stateless
    const envKey = `CTX_WARN_${sessionId}`;
    const previousLevel = process.env[envKey] || null;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';

    // Severity escalation (WARNING -> CRITICAL) always emits
    const severityEscalated = currentLevel === 'critical' && previousLevel === 'warning';

    // Skip if same level (debounce within process lifetime)
    if (previousLevel === currentLevel && !severityEscalated) {
      process.exit(0);
    }

    // Emit warning and update environment
    process.env[envKey] = currentLevel;

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
