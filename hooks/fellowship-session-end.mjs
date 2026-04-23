#!/usr/bin/env node
// SessionEnd hook for Fellowship plugin
// Appends one timestamped line to docs/fellowship/session-log.md in the project's cwd.
// Must complete within 1.5 seconds — file append is fast, this is fine.
//
// Input (stdin): { session_id, reason, cwd, hook_event_name }
// Output: {} (SessionEnd hooks don't use hookSpecificOutput — only PreToolUse/UserPromptSubmit/PostToolUse do)

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

function readStdin() {
  try {
    return readFileSync('/dev/stdin', 'utf8');
  } catch {
    return '{}';
  }
}

function respond() {
  process.stdout.write(JSON.stringify({}) + '\n');
}

let input = {};
try {
  const raw = readStdin();
  if (raw.trim()) {
    input = JSON.parse(raw);
  }
} catch {
  // Malformed input — exit cleanly, don't crash
  respond();
  process.exit(0);
}

const { session_id = 'unknown', reason = 'unknown', cwd = process.cwd() } = input;

const fellowshipDir = join(cwd, 'docs', 'fellowship');

// If docs/fellowship/ doesn't exist, this project isn't using Fellowship memory — do nothing
if (!existsSync(fellowshipDir)) {
  respond();
  process.exit(0);
}

const logPath = join(fellowshipDir, 'session-log.md');

// Build the log line
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
const logLine = `${datePart} ${timePart} | session: ${session_id} | reason: ${reason} | project: ${cwd}\n`;

try {
  if (!existsSync(logPath)) {
    // Create with header first
    const header = '# Session Log\n<!-- Auto-maintained by Fellowship. One line per session. -->\n';
    writeFileSync(logPath, header, 'utf8');
  }
  appendFileSync(logPath, logLine, 'utf8');
} catch {
  // File write failure — don't crash, just exit cleanly
}

// ── Quest-log consolidation check (P5 Move 2) ──────────────────────────
const questLogPath = join(fellowshipDir, 'quest-log.md');
if (existsSync(questLogPath)) {
  try {
    const content = readFileSync(questLogPath, 'utf8');
    // Extract the ## Current section (between ## Current and the next ## heading)
    const currentMatch = content.match(/##\s+Current\s*\n([\s\S]*?)(?=\n##\s+)/);
    if (currentMatch) {
      const currentBlock = currentMatch[1];
      const completedInCurrent = (currentBlock.match(/^-\s*\[x\]/gm) || []).length;
      if (completedInCurrent > 0) {
        const noticePath = join(fellowshipDir, '.quest-log-reminder');
        const noticeLine = `${completedInCurrent} completed item(s) in Current not yet moved to Recently Completed. Consolidate next session.\n`;
        appendFileSync(noticePath, noticeLine, 'utf8');
      }
    }
  } catch {
    // Don't crash session-end on parse failure
  }
}

respond();
process.exit(0);
