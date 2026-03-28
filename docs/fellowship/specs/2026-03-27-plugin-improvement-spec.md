# Fellowship Plugin Improvement Spec
**Date:** 2026-03-27
**Status:** Draft — not yet planned

---

## Context

After a competitive review of the closest analogues in the Claude Code ecosystem — GSD v1/v2, Everything Claude Code (ECC), BMAD, Superpowers, Continuous Claude v3, wshobson/agents, and Barkain — this spec identifies where Fellowship has genuine gaps and proposes concrete improvements. It is not a wishlist. Each item traces back to a documented failure mode or a pattern that appears across multiple mature systems.

---

## What the Ecosystem Converges On

Across the most-used multi-agent Claude Code systems, five problems keep appearing:

1. **Context rot** — quality degrades as the context window fills. Every serious system addresses this. GSD uses fresh context per task; Continuous Claude uses YAML handoffs + TLDR code analysis; GSD v2 manages context programmatically.

2. **Loss of continuity** — when a session ends (voluntarily or by crash), the next session starts blind. Systems address this with state files (GSD's STATE.md), handoff documents (Continuous Claude), or AI-compressed session summaries (claude-mem).

3. **Debug knowledge decay** — debugging insights discovered in session N are lost by session N+2. GSD, Continuous Claude, and several memory plugins explicitly address this with structured, queryable debug logs.

4. **No onboarding for new codebases** — arriving at an unfamiliar project cold is slow. GSD's `gsd:map-codebase` spawns parallel researchers to analyze stack, architecture, conventions, and pitfalls before planning begins. ECC has similar. Fellowship has nothing equivalent.

5. **Plan drift** — agents build the wrong thing when they interpret an ambiguous prompt their own way. Multiple systems (BMAD, GSD, barkain) address this with an explicit plan-before-build gate: the agent writes a plan, the orchestrator approves, then implementation begins.

Fellowship handles continuity better than most (three-zone quest log is genuinely good). It handles context rot worse than almost all of them.

---

## Fellowship's Actual Strengths

Worth stating plainly, since the spec is about gaps:

- **Character identity produces behavioral consistency.** Named personas with voice, "What You Don't Do" sections, and deviation rules produce more reliable agent behavior than functional labels like `gsd-executor`. This isn't cosmetic — it's a prompt engineering advantage.
- **Product awareness is unique.** Aragorn, product.md, and the quest log give Fellowship a dimension no other plugin has. It tracks *what* and *why*, not just *how to implement*.
- **Full lifecycle coverage.** Design (Arwen), PM (Aragorn), architecture (Merry), engineering (Gimli), review (Legolas), security (Boromir), testing (Pippin), DevOps (Sam), writing (Bilbo). No comparable plugin covers this surface.
- **Review depth.** Gimli → Legolas → Boromir with severity classification is a more thorough quality gate than any comparable plugin's verification pass.
- **Memory architecture.** The three-zone quest log (Current / Recently Completed / What Exists) with auto-consolidation to archive is a better-designed system than flat STATE.md files.

These are worth protecting. Improvements should not complicate the core model.

---

## Proposed Improvements

### 1. Context Handoff Protocol
**Priority: High**
**Effort: Medium**
**Gap it closes:** Context rot — the biggest gap vs. the field.

**Problem:** When Gandalf or Gimli reaches 60-70% context usage, quality degrades silently. The context monitor warns but there is no structured rescue. A Gimli session that runs long produces increasingly unreliable output in its final third, and when it ends, the next session starts with no record of what was partially completed.

**Proposal:** Introduce a structured handoff document format and a corresponding instruction in Gandalf and Gimli.

**Handoff format** (`docs/fellowship/handoffs/{agent}-{date}-{slug}.md`):
```
## What was done
[completed steps, decisions made, files changed]

## What is not done
[remaining work, partially completed items]

## Open questions
[unresolved ambiguities the next session should address]

## Key context
[things the next session needs to know that aren't obvious from the files]
```

**When it triggers:**
- Gandalf, when the context monitor reaches ≥65% and a Tier 3+ task is in progress: write a handoff and tell the user to start a fresh session
- Gimli, before reporting DONE on a long task: always write a handoff if the task touched more than 3 files. This gives Legolas a structured brief rather than requiring him to reconstruct context from the diff

**Instruction change in Gandalf:** "When the context monitor reports ≥65% remaining on a Tier 3+ task, stop new work. Write a handoff document to `docs/fellowship/handoffs/`. Tell the user to start a fresh session — the handoff will be injected at session start."

**Instruction change in session-start hook:** Read the most recent handoff file (if created within the last 7 days) and inject it alongside quest log and learnings.

This does not solve fresh-context-per-task (GSD v2's approach). It solves structured recovery from a degraded context — a simpler, Fellowship-native approach.

---

### 2. Debug Knowledge Base
**Priority: High**
**Effort: Low**
**Gap it closes:** Debug knowledge decay.

**Problem:** When Gimli debugs something hard — a subtle race condition, a library quirk, an unexpected interaction — that knowledge is lost after the session. The next time the same class of problem appears, Gimli starts from zero.

**Proposal:** A structured per-project debug log that Gimli appends to after resolving a debugging session, and that Gandalf injects when dispatching Gimli on a task that sounds like debugging.

**File:** `docs/fellowship/debug-log.md`

**Entry format:**
```
### [problem title] — [date]
**Symptoms:** [what the developer saw]
**Root cause:** [what was actually wrong]
**Solution:** [what fixed it]
**Relevant files:** [paths]
**Gotcha:** [what to watch for next time, if anything]
```

**Instruction change in Gimli:** "After resolving a debugging session — any task where you diagnosed a non-obvious problem — append an entry to `docs/fellowship/debug-log.md` using the debug entry format. Short entries are fine. The point is that the next session doesn't rediscover what you already know."

**Instruction change in Gandalf:** "When dispatching Gimli on a task that involves debugging or diagnosing unexpected behavior: read `docs/fellowship/debug-log.md` and include any relevant entries in the dispatch prompt."

**Instruction change in session-start hook:** Add `docs/fellowship/debug-log.md` to the injected files if it exists and is non-empty. Keep injection to the 3 most recent entries to preserve context budget.

---

### 3. Codebase Map
**Priority: Medium**
**Effort: Medium**
**Gap it closes:** Cold-start problem on new or unfamiliar projects.

**Problem:** When the Fellowship arrives at a new project, the first session is slow. Gandalf has no knowledge of the architecture. Gimli finds reference implementations by searching rather than reading a map. Aragorn doesn't know what already exists. Every agent works from zero.

**Proposal:** A `/fellowship:map` command that produces a structured codebase map, consulted by all agents on dispatch.

**File:** `docs/fellowship/codebase-map.md`

**Content (written by Merry or Gandalf directly):**
- Stack and key dependencies (what framework, what database, what auth)
- Directory structure with purpose annotations (not just names — why each folder exists)
- Entry points (where requests come in, where they go)
- Data model sketch (key entities and their relationships)
- Conventions (naming, file organization, error handling patterns found in the code)
- Known concerns (TODOs, deprecated patterns, fragile areas)

**How it runs:** Gandalf reads the codebase himself using Read/Glob/Grep (no dispatch needed for most projects — this is a Tier 1 or Tier 2 task). For large projects, dispatch Merry.

**When to run:** At the start of work on any project where `codebase-map.md` doesn't exist. Gandalf should prompt the user: "I don't have a codebase map for this project yet — should I build one before we start? It takes a few minutes and makes every subsequent task faster."

**Instruction change in Gandalf:** Include `docs/fellowship/codebase-map.md` (if it exists) in every Tier 3+ dispatch context.

**Session-start hook:** If codebase-map.md exists, inject a brief summary (first 30 lines) at session start.

---

### 4. Plan-Before-Build Gate (Tier 3+)
**Priority: Medium**
**Effort: Low**
**Gap it closes:** Plan drift — Gimli interprets an ambiguous prompt and builds the wrong thing.

**Problem:** On multi-file Tier 3+ tasks, Gimli receives a dispatch prompt and begins building immediately. If his interpretation of the requirements diverges from intent, the error isn't caught until Legolas reviews — after the build is complete.

**Proposal:** For Tier 3+ tasks, Gimli's workflow gains an explicit plan step before building.

**Instruction change in Gandalf's dispatching guidance:**
"For Tier 3+ dispatches: tell Gimli explicitly to write a plan first. His first message back should be: what he understood the task to be, what he's going to build, and what he's not going to touch. If the plan looks wrong, SendMessage to correct it before he builds."

**Instruction change in Gimli:**
"For Tier 3+ tasks (multiple files, new feature, critical path): before writing any code, write a brief plan:
- What you understand the task to be
- What files you will create or modify
- What you will not touch
- Any assumptions you're making

Send this plan back. Do not start building until you receive a go-ahead (or silence for 2 minutes, which you can treat as implicit approval)."

This is similar to BMAD's structured handoff protocols and GSD's optional plan-checker. The key constraint: **Tier 1 and 2 tasks are exempt** — the gate only applies where the cost of building the wrong thing is high.

---

### 5. Learnings Auto-Prompt After Tier 2+ Tasks
~~**Priority: Low** — **Superseded**~~

**Decision (2026-03-27):** Dropped. Claude Code's native auto memory (`~/.claude/projects/<project>/memory/`) captures the same content — debugging insights, architecture notes, tooling quirks — and loads it automatically at every session with no injection overhead. All ten companions already have `memory: project` in their frontmatter, giving each agent their own persistent domain knowledge that accumulates across sessions.

The file-based `docs/fellowship/learnings.md` was a workaround for something the platform now handles natively. Injecting it wasted context budget and created a parallel process that would inevitably fall behind what native memory captured automatically.

`learnings.md` can remain as a human-readable archive for projects that want it. It is no longer part of Fellowship's session injection. Agent report formats have been updated — the `Learnings:` section now redirects agents to write discoveries to their own memory directly.

---

## What We're Explicitly Not Building

**Fresh context per task (GSD v2 style):** GSD v2 programmatically controls the Claude Code session via Pi SDK — each task gets a fresh 200k-token window with zero accumulated state. This is the most effective solution to context rot, but it requires Fellowship to become a standalone CLI rather than a native Claude Code plugin. That defeats the low-friction install model. The handoff protocol (Improvement #1) is the Fellowship-native answer to this problem — less complete, but compatible with the plugin model.

**Vector database / semantic search:** Multiple plugins (Continuous Claude, claude-mem, Ruflo) use PostgreSQL + pgvector or similar for semantic memory retrieval. The overhead is unjustified at solo-dev scale. Fellowship's file-based memory stays well under 5MB — the threshold where search infrastructure starts paying off.

**TLDR code analysis (Continuous Claude's AST-level summarization):** 95% token savings via 5-layer AST analysis is compelling on paper. In practice, it requires a preprocessing pipeline that doesn't exist in the plugin model. The simpler win is codebase-map.md — one static file that most of the questions a code analysis pipeline would answer.

**Automatic session compression:** claude-mem uses AI to compress session summaries and injects them at start. Technically solid, but it introduces an external dependency (the claude-sdk agent call at SessionEnd) and the 1.5-second SessionEnd hook timeout makes AI calls unreliable. The handoff protocol achieves a similar outcome with simpler mechanics.

**112-agent coverage (wshobson scale):** wshobson/agents has 112 agents across enterprise domains. Fellowship serves solo product developers, not enterprise teams. 10 companions with deep character and craft beats 112 functional labels for this use case. Adding agents for Kubernetes, blockchain, or ML operations would dilute the identity without serving the user.

---

## Implementation Order

| # | Improvement | Effort | Value | Order |
|---|---|---|---|---|
| 1 | Debug knowledge base | Low | High | First |
| 2 | Plan-before-build gate | Low | Medium | Second |
| 3 | Context handoff protocol | Medium | High | Third |
| 4 | Codebase map | Medium | Medium | Fourth |
| — | ~~Learnings auto-prompt~~ | — | ~~Superseded~~ | — |

The first two are instruction-level changes — no new files, no new hooks, just updates to Gandalf and Gimli's methodology sections. They can be done in a single session. The last two require new file formats and hook changes.

---

## Open Questions

- **Handoff injection at session start:** The session-start hook currently injects quest-log and product.md. Adding a handoff file (most recent) is straightforward — but should it only inject if the handoff is recent (e.g., within 48 hours)? A stale handoff is noise.
- **Codebase map staleness:** If the codebase map is generated at project start and the project evolves significantly, the map becomes inaccurate. Should there be a way to flag it for regeneration? Options: (a) Gimli updates the map when he touches a file not in it, (b) a `/fellowship:remap` command, (c) Gandalf flags it quarterly.
- **Plan gate UX:** If Gimli sends a plan and waits, and the user doesn't respond for 2 minutes, treating silence as approval feels fragile. The alternative — always requiring explicit approval — adds friction to every Tier 3+ task. Worth testing both.
