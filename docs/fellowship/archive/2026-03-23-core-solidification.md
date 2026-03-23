# Fellowship Core Solidification — Implementation Plan

**Date:** 2026-03-23
**Status:** Approved — ready to implement
**Spec reference:** `docs/fellowship/specs/2026-03-23-dual-mode-tier-scoring.md`

---

## Goal

Harden the orchestration core before growing the companion roster. Four architectural improvements must land now — verification gate, tier scoring, model routing, and context monitor hook. All four affect every companion that will ever be built. Getting them right once means every new companion inherits correct behavior from day one.

---

## Why This Order

| Priority | Feature | Impact |
|----------|---------|--------|
| 1 | Verification gate | Without it, DONE reports are accepted on faith — companions can report done without proving it |
| 2 | Tier scoring | Without it, task classification is subjective and inconsistent across sessions |
| 3 | Model routing | Without it, every Legolas review costs as much as Gimli's entire build pass |
| 4 | Context monitor hook | Without it, companions silently degrade mid-task as context fills, producing incomplete work |
| 5 | Dual-mode prep | Enable Agent Teams for Tier 4 — low-risk, unlocks parallel coordination |
| 6 | Skill-creator pipeline | Right tool for building the next wave of companion skills |

---

## Phase 1 — Orchestration Skill Hardening

**One file, four improvements.** All changes go to `skills/orchestration/SKILL.md`.

### 1a. Tier Scoring

Add a "Tier Scoring" section to the Tiered Routing block. Full source: `docs/fellowship/specs/2026-03-23-dual-mode-tier-scoring.md` Part 1.

**Content to add:**
- Signals tables — UP signals with scores (+2 to +3), DOWN signals with scores (-1 to -3)
- Thresholds table — ≤0=T1, 1-3=T2, 4-6=T3, ≥7=T4
- "Scoring is a reasoning aid, not a formula" principle with one worked example
- Tie-breaking rule: always err toward lower tier
- User override rule: if user says "quick" or "just" — Tier 1 regardless

**Placement:** Between the Tier 4 description and the Companions table.

### 1b. Verification Gate

Strengthen the "Handling Companion Reports" section with an explicit gate before the status table:

> **DONE means verified, not believed.** Before accepting any DONE report, run the relevant tests or check the output directly. A companion saying "it should work" is not verification. If no automated tests exist, reproduce the behavior manually. A quest step is complete only when there is observable evidence it works.

Also add a companion-side expectation (applies to dispatch prompt convention):

> Every DONE report must include verification output — test results, command output, or observable evidence. A report without verification output is treated as DONE_WITH_CONCERNS until evidence is provided.

**Placement:** As a callout at the top of "Handling Companion Reports", before the status table.

### 1c. Model Routing

Add a "Model Routing" section after the intro paragraph of "Dispatching Companions".

**Content to add:**
- Routing table from spec (companion → default model → when to use inherit vs sonnet)
- Principle: companions following checklists and structured protocols run on sonnet; companions making judgment calls inherit the user's model
- Dispatch example: `Agent(fellowship:pippin, model: "sonnet")`
- Note: no changes to agent frontmatter needed — routing happens at dispatch time

**Full routing table:**

| Companion | Default model | Use inherit when | Use sonnet when |
|-----------|--------------|-----------------|-----------------|
| Gimli | inherit | New features, critical paths, complex logic | Simple fixes, config changes, established patterns |
| Legolas | sonnet | Reviewing complex architecture decisions | Standard code review (most dispatches) |
| Pippin | sonnet | Complex test infrastructure setup | Writing tests from specs (most dispatches) |
| Merry | inherit | Always — architecture decisions need strong reasoning | — |
| Aragorn | inherit | Always — product strategy needs nuance | — |
| Boromir | sonnet | Novel security concerns | OWASP checklist audits (most dispatches) |
| Sam | sonnet | — | Research is breadth, not depth (all dispatches) |
| Arwen | sonnet | Complex design system decisions | Design audits, a11y checks (most dispatches) |
| Bilbo | sonnet | — | Copy polish (all dispatches) |

**Placement:** After the "Dispatching Companions" intro, before the bullet list.

### 1d. Teams Mode (Tier 4)

Add a "Tier 4 — Agent Teams" subsection to Tiered Routing. Source: spec Part 2.

**Content to add:**
- When Teams mode activates: env var set + Tier 4 + genuinely independent parallel work streams
- Fallback: parallel subagents if any condition is false
- Team-lead behavior: task decomposition with file ownership, interface contracts first, spawn pattern, monitor via task list, synthesize results, cleanup
- Use case table: parallel review, cross-layer feature, research sprint, full feature cycle

**Placement:** As a subsection within Tier 4, after the existing Tier 4 description.

---

## Phase 2 — Agent Dual-Mode Prep

**Five agent files.** Low-risk edits. Enables Teams mode. Adds visual identity for tmux panes.

### 2a. COMMUNICATION MODE Section

Add to `agents/gimli.md`, `agents/legolas.md`, `agents/pippin.md`:

```markdown
## Communication Mode

**Subagent mode** (default): Report back to Gandalf using the standard
reporting protocol (Status, What was built, Files changed, Verification,
Concerns).

**Teammate mode** (Agent Teams): Communicate with other teammates via
SendMessage for coordination. Write substantial output to files. Send
a brief completion message to the team lead when done. Never call TeamCreate.
```

The companion doesn't need to detect which mode it's in — context makes it clear. If spawned with a `team_name` parameter, it's in teammate mode; otherwise subagent mode.

### 2b. Color Coding

Add `color` field to agent frontmatter. No functional impact in subagent mode — visual distinction in Teams mode split panes only.

| Agent file | Color |
|-----------|-------|
| `agents/gimli.md` | red |
| `agents/legolas.md` | green |
| `agents/pippin.md` | yellow |

### 2c. Gandalf Description Update

Update `agents/gandalf.md` frontmatter description to include team-lead capability: "...and serves as team lead in Tier 4 Agent Teams mode, decomposing parallel work streams and maintaining file ownership boundaries."

---

## Phase 3 — Context Monitor Hook

**New infrastructure.** Prevents silent degradation when companions run out of context mid-task.

### What it does

A PostToolUse hook that reads remaining context percentage after each tool call and injects a warning at two thresholds:

- **≤35% remaining:** "Context window filling. Avoid starting new complex work. Finish current task or save progress to a file."
- **≤25% remaining:** "Context critical. Stop new work immediately. Write your current progress and state to a file. Report back to Gandalf with what's done and what remains."

The warning is injected into the companion's conversation (not just the user's status bar) so it actually influences behavior.

### Files

| File | Action |
|------|--------|
| `hooks/context-monitor.js` | New — ~50 lines. PostToolUse handler. Reads context stats, injects warning via `additionalContext` when threshold crossed. Only fires when threshold is newly crossed, not on every tool call. |
| `settings.json` | Add to PostToolUse hooks array: `{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/context-monitor.js\"" }` |

### Reference implementation

GSD's `hooks/gsd-context-monitor.js` in `examples/gsd-get-shit-done/`. Same pattern. Read it before building.

### Success criteria

- A companion at ≤35% receives the warning once (not on every tool call after that)
- A companion at ≤25% stops new work and writes state to a file
- Hook adds no overhead when context is healthy (exits early with no output)
- No false positives — threshold crossing is idempotent per session

---

## Phase 4 — Skill Quality Pipeline

**Process decision, not a build task.** How we build and validate all future companion skills.

### Decision

Use the official Anthropic skill-creator for all new companion skill development. Do not build a custom validator — the upstream tool is more capable and already proven.

**Reference:** `https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md`

### What this means for future skill work

When building any new skill (devops, documentation, architecture, security, etc.):

1. Follow progressive disclosure architecture: metadata frontmatter (~100 words, always in context) → SKILL.md body (<500 lines) → bundled resources (on-demand, unlimited)
2. Write binary eval assertions (`evals/evals.json`) covering the skill's key behaviors
3. Run parallel with-skill vs baseline comparison before calling the skill done
4. Optimize the skill description using the trigger eval query loop (F1 score measurement)
5. Only ship when the skill demonstrably improves outcomes over baseline

### Quest log update

Add to quest log Up Next: "When building new skills — run through Anthropic skill-creator eval loop (ref: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)"

---

## Phase 5 — Remaining Companions (deferred)

Build after Phases 1–3 are confirmed stable. Each companion requires a spec before building.

**Sequence and blockers:**

| Companion | Role | Blocker |
|-----------|------|---------|
| Aragorn | Scope guardian (Tier 4) | Spec needed |
| Sam | DevOps / Infrastructure | Spec needed + devops skill |
| Bilbo | Technical Writer | Spec needed + documentation skill |
| Boromir | Security Engineer | Spec needed + security skill |
| Arwen | Product Designer + UX Writer | Spec needed + design skill |
| Merry | Technical Architect | Spec needed + architecture skill |

Each companion built using the skill-creator eval loop (Phase 4 process).

---

## Execution Sequence

Phases 1 and 2 can run in parallel (different files). Phase 3 is independent infrastructure. Phase 4 is a process note.

```
┌─────────────────────────────────────┐
│  Phase 1: skills/orchestration      │  (Gimli builds)
│  Phase 2: agent files               │  (Gimli builds, same pass)
└──────────────────┬──────────────────┘
                   │ confirm stable
                   ▼
┌─────────────────────────────────────┐
│  Phase 3: context-monitor hook      │  (Gimli builds)
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Phase 4: process decision noted    │  (quest log update)
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Phase 5: remaining companions      │  (deferred, spec first)
└─────────────────────────────────────┘
```

---

## File Change Summary

| File | Phase | Action |
|------|-------|--------|
| `skills/orchestration/SKILL.md` | 1 | Add tier scoring, verification gate, model routing, Teams section |
| `agents/gimli.md` | 2 | Add COMMUNICATION MODE, add color |
| `agents/legolas.md` | 2 | Add COMMUNICATION MODE, add color |
| `agents/pippin.md` | 2 | Add COMMUNICATION MODE, add color |
| `agents/gandalf.md` | 2 | Update description for team-lead |
| `hooks/context-monitor.js` | 3 | New file — context threshold monitor |
| `settings.json` | 3 | Register PostToolUse hook |
| `docs/fellowship/quest-log.md` | 4 | Add skill-creator process note |
