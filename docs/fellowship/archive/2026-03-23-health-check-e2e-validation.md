# Health-Check Utility — E2E Validation Plan

**Date:** 2026-03-23
**Goal:** Build a plugin health-check script that validates Fellowship wiring, then use it as the proving ground for the full Gimli → Legolas → Pippin dispatch cycle.

## Why this task

We need to validate that the companion dispatch cycle works end-to-end. Rather than a toy example, we build something the project actually needs — a config validator that catches wiring mistakes as we add companions and skills. Small enough for one cycle, complex enough to have real edge cases.

## What the health-check validates

| Check | Input | Pass condition |
|-------|-------|----------------|
| Plugin manifest | `plugin.json` | Exists, valid JSON, has `name`, `description`, `version` |
| Settings | `settings.json` | Exists, valid JSON, `agent` field resolves to a real agent file |
| Hook scripts | `hooks/hooks.json` | Valid JSON, every `command` references a script that exists and is executable |
| Agent frontmatter | `agents/*.md` | Valid YAML frontmatter, `skills` array entries match directories in `skills/` |
| Agent tools | `agents/*.md` | `tools` array contains only known tool names (`Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash`) |
| Skill directories | `skills/*/` | Every skill dir contains a `SKILL.md` file |
| Cross-references | all of above | No orphan skills (skill dir exists but no agent references it), no dangling agent refs |

## What it outputs

Clean terminal output — one line per check, pass/fail marker, final summary with counts. Exit code 0 if all pass, 1 if any fail.

Example:
```
Fellowship Health Check
=======================
✓ plugin.json — valid, all required fields present
✓ settings.json — agent "fellowship:gandalf" resolves to agents/gandalf.md
✓ hooks/hooks.json — 1 hook group, all scripts found
✓ agents/gandalf.md — frontmatter valid, 6 skills resolve
✓ agents/gimli.md — frontmatter valid, 1 skill resolves
✗ agents/gimli.md — tool "Foo" not in known tools list
✓ skills/engineering/ — SKILL.md present

Summary: 11 passed, 1 failed
```

## What it doesn't do (scope boundary)

- No runtime execution of hooks — structural validation only
- No network calls
- No file modification
- No deep SKILL.md content validation (just existence)

## Implementation details

- **File:** `hooks/health-check.mjs` (ES module, Node.js, no external deps)
- **YAML parsing:** Simple frontmatter extraction (split on `---` delimiters), not a full YAML parser. The frontmatter in our agents is simple enough — flat fields and arrays.
- **Plugin root:** Resolve relative to script location, same pattern as `session-start`
- **Runner:** `node hooks/health-check.mjs` from repo root (or any directory — uses `import.meta.url` for paths)

## Dispatch plan — the full cycle

### Phase 1: Gimli builds it
Dispatch Gimli with this plan. He implements `hooks/health-check.mjs` following the spec above.

**Gimli's deliverable:** Working script, self-verified by running it against the current repo.

### Phase 2: Legolas reviews it
Dispatch Legolas with Gimli's report + this plan as the spec.

**Legolas checks:**
- Does the script validate everything listed in the spec? Nothing more, nothing less?
- Edge case handling — what happens with malformed JSON, missing files, empty frontmatter?
- Code quality — clean, readable, no unnecessary complexity?
- Does the output format match the spec?

**If Legolas finds issues:** Send findings back to Gimli via SendMessage. Gimli fixes. Legolas re-reviews.

### Phase 3: Pippin tests it
Dispatch Pippin in test-after mode with this plan + what Gimli built.

**Pippin's scope:**
- Create `tests/health-check.test.mjs` (or similar)
- Test happy path: current repo should pass all checks
- Test failure cases: create temp fixtures with broken configs and verify the script catches them
  - Malformed JSON in plugin.json
  - Missing agent file referenced by settings.json
  - Agent frontmatter referencing nonexistent skill
  - Skill directory without SKILL.md
  - Agent with unknown tool name
- Test edge cases: empty files, files with only `---` delimiters, agent with no skills field

**If tests reveal implementation bugs:** Report back, Gimli fixes, Pippin re-runs.

## Order of operations

```
Phase 1: Gimli → builds health-check.mjs
Phase 2: Legolas → reviews (may cycle back to Gimli)
Phase 3: Pippin → writes and runs tests (may cycle back to Gimli)
```

Each phase completes before the next begins. Gandalf coordinates the handoffs.

## What "done" looks like

- `hooks/health-check.mjs` exists and runs cleanly on the current repo
- Legolas has approved the implementation (APPROVED or APPROVED_WITH_CONCERNS, no Critical/High findings)
- Pippin's tests pass — both happy path and failure cases
- The dispatch cycle has been exercised: Gandalf → Gimli → Legolas → (Gimli fix loop if needed) → Pippin → (Gimli fix loop if needed)
- Quest log updated with results and any learnings about the dispatch process itself
