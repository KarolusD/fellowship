#!/usr/bin/env node

/**
 * Fellowship Plan Gate (v1.0 — fail-open)
 *
 * PreToolUse hook scoped to Edit|Write|MultiEdit. When invoked in a Gimli
 * subagent context, checks for a plan file at $CLAUDE_SCRATCHPAD_DIR/gimli-plan-*.md.
 * If absent and no Tier: 1|2 opt-out marker is present in the dispatch, emits
 * a stderr warning and exits 0 (fail-open). v1.1 will upgrade to fail-closed.
 *
 * Spec: docs/fellowship/specs/2026-04-26-adr-plan-before-build-hook.md
 */

import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const TARGET_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);
const SCRATCHPAD_FALLBACK = '/tmp/scratchpad';
const PLAN_GLOB = /^gimli-plan-.*\.md$/;
const OPT_OUT_RE = /(?:^|\s)Tier:\s*[12]\b|<no-plan>/;

function silentExit() {
  process.exit(0);
}

function warnAndExit(msg) {
  process.stderr.write(`[fellowship-plan-gate] ${msg}\n`);
  process.exit(0);
}

async function readStdin() {
  return new Promise((resolveP) => {
    let data = '';
    if (process.stdin.isTTY) return resolveP('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolveP(data));
    // Safety: short timeout so we don't hang the tool call
    setTimeout(() => resolveP(data), 500);
  });
}

function planFilePresent(dir) {
  if (!dir || !existsSync(dir)) return false;
  try {
    return readdirSync(dir).some((f) => PLAN_GLOB.test(f));
  } catch {
    return false;
  }
}

function optOutPresent(payload) {
  // Check tool_input fields and dispatch prompt env for declarative markers.
  const haystacks = [];
  if (payload && typeof payload === 'object') {
    const ti = payload.tool_input;
    if (ti && typeof ti === 'object') {
      for (const v of Object.values(ti)) {
        if (typeof v === 'string') haystacks.push(v);
      }
    }
    if (typeof payload.prompt === 'string') haystacks.push(payload.prompt);
  }
  if (process.env.CLAUDE_DISPATCH_PROMPT) {
    haystacks.push(process.env.CLAUDE_DISPATCH_PROMPT);
  }
  return haystacks.some((s) => OPT_OUT_RE.test(s));
}

function isGimliSubagent() {
  // Primary signal: Claude Code sets agent identity in env. The exact var name
  // may differ across versions — check the common candidates. If none are set,
  // assume non-gimli context (permissive) — fail-open posture for v1.0.
  const candidates = [
    process.env.CLAUDE_AGENT_TYPE,
    process.env.CLAUDE_SUBAGENT_TYPE,
    process.env.CLAUDE_AGENT,
  ].filter(Boolean);
  if (candidates.length === 0) return false;
  return candidates.some((v) => /(^|:)gimli$/i.test(v));
}

async function main() {
  let payload = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) payload = JSON.parse(raw);
  } catch {
    // Malformed payload — fail-open silently. We can't gate what we can't parse.
    silentExit();
  }

  // Diagnostic mode (v1.0 → v1.1 transition aid):
  // If FELLOWSHIP_PLAN_GATE_DEBUG=1, emit the env keys matching /CLAUDE/i to
  // stderr on every invocation. Lets a real Gimli dispatch reveal the actual
  // env-var name for subagent identity, so v1.1 can flip fail-closed safely.
  if (process.env.FELLOWSHIP_PLAN_GATE_DEBUG === '1') {
    const claudeKeys = Object.keys(process.env)
      .filter((k) => /CLAUDE/i.test(k))
      .sort();
    process.stderr.write(
      `[fellowship-plan-gate:debug] CLAUDE env keys: ${JSON.stringify(claudeKeys)}\n` +
      `[fellowship-plan-gate:debug] payload keys: ${JSON.stringify(Object.keys(payload))}\n` +
      `[fellowship-plan-gate:debug] tool_name: ${payload.tool_name || payload.tool || '(none)'}\n`
    );
  }

  const toolName = payload.tool_name || payload.tool || '';
  if (!TARGET_TOOLS.has(toolName)) silentExit();

  if (!isGimliSubagent()) silentExit();

  const scratchpad = process.env.CLAUDE_SCRATCHPAD_DIR || SCRATCHPAD_FALLBACK;

  if (planFilePresent(resolve(scratchpad))) silentExit();

  if (optOutPresent(payload)) silentExit();

  warnAndExit(
    `no gimli-plan-*.md found in ${scratchpad}. ` +
    `Write a plan before editing (Tier 3+). ` +
    `Fail-open in v1.0; this will block in v1.1.`
  );
}

main().catch((err) => {
  // Any uncaught error → fail-open with diagnostic.
  warnAndExit(`hook error: ${err && err.message ? err.message : String(err)}`);
});
