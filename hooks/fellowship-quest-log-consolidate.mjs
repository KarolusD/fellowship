#!/usr/bin/env node
// Quest-log auto-consolidation routine — runs at SessionStart and SessionEnd, plus /fellowship:consolidate.
// Trims `## Recently Completed` to 7 entries; appends overflow (oldest) to quest-log-archive.md
// under a dated `## Archived YYYY-MM-DD` heading. Archive-first, atomic writes, fail-silent
// fallback to .quest-log-reminder on any structural ambiguity. Idempotent.
//
// Spec: docs/fellowship/specs/2026-04-22-quest-log-consolidation.md
//
// Invocation modes:
//   - Hook path: stdin contains JSON ({ session_id, cwd, ... }) → silent, respond({}).
//   - Slash command path: no stdin → write a one-line stdout summary.
//
// Defensive style: top-level try/catch, never throw to process boundary, exit 0 on every path.

import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  renameSync,
} from 'fs';
import { join } from 'path';

// Top-level safety net: if anything below blocks (e.g. non-closing stdin pipe
// on a future invocation path), force-exit after 10s so we never freeze the
// session. unref() so we don't keep the event loop alive when work finishes
// normally. Mirrors hooks/fellowship-context-monitor.mjs.
setTimeout(() => process.exit(0), 10000).unref();

const THRESHOLD = 7;

// ── stdin handling ────────────────────────────────────────────────────
// Detect whether stdin has JSON payload. If TTY, definitely no stdin.
// Otherwise try to read; empty buffer means slash-command invocation.
function readStdinSync() {
  if (process.stdin.isTTY) return '';
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const rawStdin = readStdinSync();
const isHookInvocation = rawStdin.trim().length > 0;

let input = {};
if (isHookInvocation) {
  try {
    input = JSON.parse(rawStdin);
  } catch {
    // Malformed input — treat as hook anyway (silent path).
    input = {};
  }
}

const cwd = input.cwd || process.cwd();

// ── output helpers ────────────────────────────────────────────────────
function respondHook() {
  if (isHookInvocation) process.stdout.write(JSON.stringify({}) + '\n');
}

function speak(line) {
  // Slash command path: surface a one-line summary on stdout.
  if (!isHookInvocation) process.stdout.write(line + '\n');
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function atomicWrite(targetPath, contents) {
  // Unique suffix prevents .tmp collisions if two consolidate runs race
  // (e.g. SessionStart and a slash-command invocation overlapping).
  const tmp = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, contents, 'utf8');
  renameSync(tmp, targetPath);
}

function appendReminder(fellowshipDir, message) {
  try {
    const reminderPath = join(fellowshipDir, '.quest-log-reminder');
    appendFileSync(reminderPath, message + '\n', 'utf8');
  } catch {
    // Even reminder write failed — swallow. Never crash.
  }
}

// ── main routine, wrapped in defensive try/catch ──────────────────────
try {
  const fellowshipDir = join(cwd, 'docs', 'fellowship');
  const questLogPath = join(fellowshipDir, 'quest-log.md');
  const archivePath = join(fellowshipDir, 'quest-log-archive.md');

  // 1. Quest log missing → silent exit (project may not use Fellowship memory).
  if (!existsSync(questLogPath)) {
    respondHook();
    speak('No quest log found — nothing to consolidate.');
    process.exit(0);
  }

  // 2. Read live log.
  const content = readFileSync(questLogPath, 'utf8');

  // 3. Locate `## Recently Completed` block (heading line excluded; up to next ## or EOF).
  const sectionRe = /##\s+Recently Completed\s*\n([\s\S]*?)(?=\n##\s+|$)/;
  const sectionMatch = content.match(sectionRe);
  if (!sectionMatch) {
    appendReminder(fellowshipDir, 'Recently Completed section not found');
    respondHook();
    speak('Could not consolidate — see .quest-log-reminder.');
    process.exit(0);
  }
  const block = sectionMatch[1];
  const blockStart = sectionMatch.index + sectionMatch[0].indexOf(block);
  const blockEnd = blockStart + block.length;

  // 4. Parse entries. Top-level `- [x]` or `- [ ]`, with optional indented sub-bullets.
  const entryRe = /^-\s+\[[x ]\]\s+.+(?:\n[ \t]+-\s+.+)*/gm;
  const entries = block.match(entryRe) || [];

  // 5. Structural ambiguity: block has content but parser found nothing.
  if (entries.length === 0) {
    if (block.trim().length > 0) {
      appendReminder(fellowshipDir, 'Could not parse Recently Completed entries');
      respondHook();
      speak('Could not consolidate — see .quest-log-reminder.');
      process.exit(0);
    }
    // Empty block, nothing to do.
    respondHook();
    speak(`No consolidation needed (0 entries).`);
    process.exit(0);
  }

  // 6. Idempotency: already at or under threshold.
  if (entries.length <= THRESHOLD) {
    respondHook();
    speak(`No consolidation needed (${entries.length} entries).`);
    process.exit(0);
  }

  // 7. Split: keep newest THRESHOLD, overflow = oldest remainder.
  const keep = entries.slice(0, THRESHOLD);
  const overflow = entries.slice(THRESHOLD);

  // 8. Build archive lines from overflow.
  const today = todayISO();
  const dateLineRe = /\((\d{4}-\d{2}-\d{2})\)\s*$/;
  const stripPrefixRe = /^-\s+\[[x ]\]\s+/;

  const archiveLines = overflow.map((entry) => {
    const firstLine = entry.split('\n')[0];
    const dateMatch = firstLine.match(dateLineRe);
    const entryDate = dateMatch ? dateMatch[1] : today;

    let summary = firstLine.replace(stripPrefixRe, '');
    summary = summary.replace(dateLineRe, '').replace(/\s+$/, '');

    if (summary.length > 200) summary = summary.slice(0, 197) + '...';
    return `- [${entryDate}] ${summary}`;
  });

  // 9. Compose archive update — append under today's `## Archived YYYY-MM-DD` heading,
  //    creating it if absent, reusing it if present.
  let archiveBefore = existsSync(archivePath) ? readFileSync(archivePath, 'utf8') : '';
  if (archiveBefore.length > 0 && !archiveBefore.endsWith('\n')) {
    archiveBefore += '\n';
  }

  const todayHeading = `## Archived ${today}`;
  const headingRe = new RegExp(`^${todayHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const headingMatch = archiveBefore.match(headingRe);

  let archiveAfter;
  if (headingMatch) {
    // Today's heading exists — append lines under it. Find the END of that section
    // (next `## ` heading or EOF) and insert archive lines just before that boundary.
    const sectionStart = headingMatch.index + headingMatch[0].length;
    const tail = archiveBefore.slice(sectionStart);
    const nextHeadingMatch = tail.match(/\n##\s+/);
    const insertAt = nextHeadingMatch
      ? sectionStart + nextHeadingMatch.index
      : archiveBefore.length;

    const before = archiveBefore.slice(0, insertAt).replace(/\s+$/, '');
    const after = archiveBefore.slice(insertAt);
    archiveAfter = `${before}\n${archiveLines.join('\n')}\n${after.startsWith('\n') ? after : '\n' + after}`;
    if (!archiveAfter.endsWith('\n')) archiveAfter += '\n';
  } else {
    // Create new dated heading at end of file.
    const sep = archiveBefore.length > 0 ? '\n' : '';
    archiveAfter = `${archiveBefore}${sep}${todayHeading}\n\n${archiveLines.join('\n')}\n`;
  }

  // 10. Archive first — atomic write.
  try {
    atomicWrite(archivePath, archiveAfter);
  } catch (err) {
    appendReminder(fellowshipDir, `Archive write failed: ${err.message}`);
    respondHook();
    speak('Could not consolidate — see .quest-log-reminder.');
    process.exit(0);
  }

  // 11. Verify archive write — re-read and confirm every overflow line is present.
  let archiveVerify;
  try {
    archiveVerify = readFileSync(archivePath, 'utf8');
  } catch (err) {
    appendReminder(fellowshipDir, `Archive verification failed: ${err.message}`);
    respondHook();
    speak('Could not consolidate — see .quest-log-reminder.');
    process.exit(0);
  }
  for (const line of archiveLines) {
    if (!archiveVerify.includes(line)) {
      appendReminder(fellowshipDir, 'Archive verification failed');
      respondHook();
      speak('Could not consolidate — see .quest-log-reminder.');
      process.exit(0);
    }
  }

  // 12. Now trim the live log. Reconstruct the section with only `keep` entries.
  const newBlock = keep.join('\n') + '\n';
  let newContent = content.slice(0, blockStart) + newBlock + content.slice(blockEnd);

  // 13. Refresh `**Last updated:** YYYY-MM-DD` near the top.
  newContent = newContent.replace(
    /^\*\*Last updated:\*\*\s+\d{4}-\d{2}-\d{2}\s*$/m,
    `**Last updated:** ${today}`
  );

  // 14. Atomic write live log.
  try {
    atomicWrite(questLogPath, newContent);
  } catch (err) {
    appendReminder(
      fellowshipDir,
      `Live log write failed AFTER archive succeeded — manual trim needed: ${err.message}`
    );
    respondHook();
    speak('Could not consolidate — see .quest-log-reminder.');
    process.exit(0);
  }

  respondHook();
  speak(`Trimmed ${overflow.length} entr${overflow.length === 1 ? 'y' : 'ies'} to archive.`);
  process.exit(0);
} catch (err) {
  // Anything we did not anticipate.
  try {
    const fellowshipDir = join(cwd, 'docs', 'fellowship');
    appendReminder(
      fellowshipDir,
      `Consolidation failed: ${err.message}. Trim Recently Completed to 7 manually.`
    );
  } catch {
    // give up silently
  }
  respondHook();
  speak('Could not consolidate — see .quest-log-reminder.');
  process.exit(0);
}
