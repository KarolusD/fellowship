# Dual-Mode Architecture: Subagents + Agent Teams — Design Spec

**Date:** 2026-03-22
**Status:** Draft — ready for implementation brainstorming

## What We're Building

Fellowship should support two execution modes with the same companions:

1. **Subagent mode** (current, stable) — Gandalf dispatches companions via the Agent tool. Fire-and-forget workers that report back.
2. **Agent Teams mode** (experimental, opt-in) — Gandalf spawns companions as teammates. Persistent peers that communicate directly with each other and with Frodo.

The user opts into Agent Teams by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in their settings. Fellowship detects this at runtime and adjusts behavior. No separate plugin configuration needed.

## Why Both Modes

### Subagents are right for focused delegation
- Tier 1-2 work: quick fixes, single companion dispatches
- Lower token cost (~1x vs ~7x for teams)
- Stable, proven, no experimental bugs
- Result-oriented: "build this, report back"

### Agent Teams are right for collaboration and sustained work
- Tier 3-4 work: parallel review, multi-perspective debate, cross-layer coordination
- Sustained 1:1 collaboration: 2-hour design session with Arwen, deep debugging with Pippin
- Direct conversation: Frodo talks to any companion without going through Gandalf
- Peer communication: companions challenge each other's findings
- More lore-accurate: the Fellowship is peers, not a command hierarchy

### The key insight
It's not just about tiers. Agent Teams excels at **sustained collaboration with a specialist** — even for single-companion work. A 2-hour design session with Arwen as a teammate (persistent, remembers context, direct conversation) is fundamentally better than 15 subagent dispatches through Gandalf.

## Key Decisions to Make

### 1. When does Gandalf use which mode?

Options:
- **A) Tier-based** — Tier 1-2 uses subagents, Tier 3-4 uses Agent Teams
- **B) Always Agent Teams when available** — only fall back to subagents when env var not set
- **C) User-triggered** — Gandalf uses subagents by default, user says "assemble the team" for Agent Teams
- **D) Gandalf decides** — based on task complexity, expected duration, need for inter-companion communication

### 2. How are companions spawned as teammates?

From wshobson's codebase: `subagent_type: "fellowship:gimli"` references plugin-scoped agent files. Need to confirm this works — that teammates get the agent identity (personality, boundaries) and auto-load skills from frontmatter.

### 3. Preset team compositions

Inspired by wshobson's presets:

| Preset | Companions | Use case |
|---|---|---|
| **Council** | Aragorn + Merry + Sam | Multi-perspective brainstorming |
| **Review** | Legolas + Boromir + Pippin | Parallel code review |
| **Build** | Gimli + Pippin | Implementation + testing |
| **Design** | Arwen + Bilbo + Aragorn | Design + copy + product |

Should these be predefined, or should Gandalf compose teams dynamically?

### 4. File ownership in parallel work

All Agent Teams codebases enforce explicit file ownership. Should this be:
- Part of the orchestration skill (Gandalf assigns file ownership in the spawn prompt)
- Part of each companion's skill (companions know to claim files)
- Part of the planning skill (plans assign file ownership per task)

### 5. Structured messaging protocol

teamclaude uses prefixed messages (`TASK_ASSIGNED:`, `READY_FOR_REVIEW:`, `APPROVED:`). Should Fellowship have a similar protocol, or rely on natural language between companions?

### 6. Learnings integration in team mode

Our Learnings field in companion reports maps to teamclaude's `PROCESS_LEARNING:` pattern. In team mode, should:
- Teammates emit learnings as messages to Gandalf (lead)
- Gandalf persists them to `docs/fellowship/learnings.md` as usual
- Or teammates write to learnings directly (risk: file conflicts)

### 7. Shared memory safety

Quest log, learnings, product.md — our design says only Gandalf writes. Does this hold in Agent Teams mode?
- Teammates should message Gandalf with observations, not write to shared files
- Gandalf (lead) is the only one persisting to `docs/fellowship/`
- This matches the current design and avoids file conflicts

## Technical Requirements

### Detection
- Orchestration skill instructs Gandalf to check `echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` via Bash
- Branch behavior based on result
- Graceful fallback: if check fails or returns empty, use subagent mode

### Companion compatibility
- Agent files (gimli.md, gandalf.md) use markdown + YAML frontmatter — same format as teamclaude and wshobson
- Skills load automatically for teammates (confirmed by docs: "teammates load CLAUDE.md, MCP servers, and skills")
- Need to verify: does `subagent_type: "fellowship:gimli"` load the agent file with personality and tool restrictions?

### One team per session constraint
- Gandalf can only manage one team at a time
- Must clean up team before creating a new one
- For Tier 3 sequential work: use subagents (no team needed) or one team with task dependencies

## Approaches Considered

### Full Agent Teams only
Replace subagents entirely. **Rejected because:** experimental, 7x token cost, bugs with silent exits and orphaned state. Too risky as the only execution model.

### Subagents only (current)
Never use Agent Teams. **Rejected because:** misses the sustained collaboration UX, less lore-accurate, can't do peer communication or parallel review properly.

### Dual-mode with runtime toggle (proposed)
Support both, detect at runtime, Gandalf decides based on availability and task nature. **Selected because:** best of both worlds, graceful degradation, future-proof.

## Open Questions

- Can teammates load custom agent files via `subagent_type`? Needs testing.
- Does the one-team-per-session constraint block switching between team compositions mid-session?
- How does plan approval mode interact with Fellowship's brainstorming/planning flow?
- Should `/fellowship:council` be an explicit command for assembling a team, or should Gandalf propose it?

## Research Sources

See `docs/fellowship/research.md` — "Agent Teams: Future Direction" section for full research, codebase analysis, and bug tracking.
