# Engineering Skill & Orchestration Protocol — Design Spec

**Date:** 2026-03-22
**Status:** Active

## What We're Building

Five connected pieces that enable Gandalf to dispatch Gimli for implementation work and get reliable results back:

1. **Engineering skill** (`skills/engineering/SKILL.md`) — Gimli's handbook for building things well
2. **Gandalf status-handling update** (`agents/gandalf.md`) — how Gandalf processes subagent returns, dispatches companions, and curates memory
3. **Quest log format** — cross-session memory for task continuity
4. **Learnings log** (`docs/fellowship/learnings.md`) — episodic memory for project-level discoveries
5. **Brainstorming skill update** (`skills/brainstorming/SKILL.md`) — tier-aware artifact generation

## Approach: Principles + Reporting Protocol (Option B)

The engineering skill provides engineering principles and a communication contract with Gandalf. It does not prescribe workflow stages — Gimli adapts his process to the situation, but reports back in a consistent format.

### Why not workflow stages (Option C)?

Research from Anthropic, Superpowers, and multi-agent framework analysis consistently shows:

- **The orchestrator owns the workflow; the worker owns the craft.** Superpowers follows this pattern — heavy process lives in the orchestrator (SKILL.md), not the implementer prompt.
- **LLM reasoning degrades around 3,000 tokens of instruction.** Prescriptive workflow stages consume context that Gimli needs for actual implementation.
- **Rigid stages can't handle the unexpected.** If the codebase has an unusual structure, prescribed steps may force the agent down the wrong path.
- **Anthropic's own guidance:** "Instill good heuristics rather than rigid rules."

### Why not principles-only (Option A)?

Claude Code returns subagent output as unstructured free text. Without a defined reporting format, Gandalf can't reliably determine whether a task succeeded, has concerns, or is blocked. Every multi-agent framework that works has structured output from workers.

## Key Decisions

### 1. Engineering Skill Content

**Seven principles (~800-1200 tokens total):**

| Principle | What it means |
|---|---|
| Understand before building | Read the task. Explore the code. Find 2-3 similar implementations as reference. If greenfield, be deliberate — you're setting the convention. |
| Match existing patterns | Follow the codebase's conventions for naming, structure, error handling. Don't invent new patterns when existing ones work. |
| Simplicity first | Functions over classes. No abstraction bloat. YAGNI. Prefer the simplest approach that solves the problem. |
| Build incrementally | One logical change at a time. Verify each step works before moving to the next. |
| Keep checks local | Auth, validation, permissions — keep them visible in the handler, not hidden in middleware chains. |
| No dead code | Clean up after yourself. Don't leave commented-out code, unused imports, or orphaned files. |
| Verify your work | Run existing tests to confirm nothing broke. Write new tests only for non-trivial logic, data transformations, and critical paths. For config, copy, and styling — running the app and showing the result is sufficient. |

**Why the verification principle exists (and why it's not TDD):**

Superpowers mandates TDD as an iron law: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST." This produces comprehensive coverage but creates test sprawl — every feature gets tests regardless of complexity.

Fellowship takes a different approach because we have specialized companions:
- **Gimli** verifies his own work as part of implementation. He runs existing tests and writes new tests only where they add real value (non-trivial logic, data handling, critical paths).
- **Pippin** (Test Engineer) writes thorough test suites as a dedicated, planned task — integration tests, edge case coverage, test infrastructure.
- **Gandalf** decides whether to dispatch Pippin after reviewing Gimli's report. Critical code (auth, payments, data mutations) warrants Pippin. Simple features don't.

The key insight: **verification is mandatory, new tests are not.** Gimli always proves his work is correct. How he proves it depends on the nature of the change.

**Self-review checklist (lightweight):**

Before reporting, Gimli verifies his own work:
- Requirement fulfilled — re-read the task and check
- Patterns matched — compare against codebase references
- Edge cases — empty input, missing data, concurrent access
- Error paths — failures produce clear messages, errors handled not swallowed
- No dead code — no commented-out code, unused imports, leftover debugging
- Security — no injection, no hardcoded secrets, no overly permissive access
- Scope — only changed what was asked, no unrelated "improvements"
- Tests — existing tests pass, new tests written where warranted

**Why security and scope were added to the checklist:**
- **Security:** 45% of AI-generated code contains OWASP Top-10 vulnerabilities (Wiz Research 2025). This doesn't make Gimli a security specialist (that's Boromir), but basic hygiene — no injection, no hardcoded secrets — should be checked every time.
- **Scope:** Documented AI failure mode — agents make unsolicited changes, refactoring things they weren't asked to touch. Anthropic's Claude Code system prompt explicitly says "only make changes that are directly requested or clearly necessary."

**Escalation protocol:**

Explicit instruction that bad work is worse than no work. Clear triggers for when to stop and ask:
- Ambiguous requirements — multiple valid interpretations
- Multiple valid approaches — tradeoffs aren't clear-cut
- High-impact or destructive operations — data migrations, auth changes, public API modifications, deleting files/branches
- Low confidence — something feels wrong but can't be pinpointed
- Stuck and not converging — attempts aren't making progress

**How to escalate:** State what you know, what you don't know, and what you need. Be specific.

**Why:** Every source in the research flagged "forcing solutions instead of stopping" as the most dangerous failure mode. Must be explicit and prominent.

### 2. Reporting Protocol (4-Status Contract)

```
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

What was built:
  [concise description of what was implemented or attempted]

Files changed:
  [list of file paths — created, modified, or deleted]

Verification:
  [exact commands run and their output — tests, linting, type checks, manual verification]

Concerns: (include only if DONE_WITH_CONCERNS)
  [specific doubts with reasoning — what might be wrong and why]

Blocker: (include only if BLOCKED)
  [what's blocking, what was tried, what help is needed]

Missing info: (include only if NEEDS_CONTEXT)
  [specific questions — what is needed to proceed]

Learnings: (include only if you discovered something reusable)
  [detailed observations — library quirks, codebase constraints, tooling gotchas.
   Be specific; the orchestrator decides whether to persist these to learnings.md]
```

**Why the Learnings field:** Companions have the full context of what they discovered during execution. Gandalf only sees the report summary, so detail would be lost without this field. The companion provides detailed observations; Gandalf curates what's worth persisting to `docs/fellowship/learnings.md`.

**Why:** Adopted from Superpowers' proven 4-status protocol, which is the most mature open-source example of orchestrator-subagent communication for Claude Code. The format is the minimum needed for Gandalf to make routing decisions.

**Artifact bypass pattern:** When Gimli produces large output (full file implementations, test suites), he commits his work and reports a summary + file paths. Gandalf gets the summary; Legolas reads the actual files during review. This preserves Gandalf's context window for orchestration.

### 3. Gandalf Updates

Three new sections added to `agents/gandalf.md`:

**Status-handling logic:**

| Status | Gandalf's action |
|---|---|
| DONE | Verify (run tests, check output), mark quest step complete, proceed to next step or dispatch reviewer |
| DONE_WITH_CONCERNS | Read concerns. If correctness/scope issue → address before proceeding. If observation → note and proceed. Optionally persist reusable observations to learnings log. |
| NEEDS_CONTEXT | Provide missing info and re-dispatch the same companion |
| BLOCKED | Assess: context problem (re-dispatch with more info), complexity problem (break task down), plan problem (revisit with user) |

**Critical rule:** Never ignore an escalation. Never force the same agent to retry without changes.

**Dispatching protocol:**

When dispatching a companion, Gandalf provides in the prompt:
- Full task description — paste it, don't make them read files
- Relevant context — what exists, what was decided, dependencies
- Scope boundaries — what NOT to do
- References — similar implementations in the codebase

The companion's skills (loaded via frontmatter) handle their craft methodology and reporting format. Gandalf doesn't repeat those.

**Memory curation:**

Gandalf reads the quest log and learnings at session start. When dispatching, he selects only relevant memories for each companion's prompt. Companions don't search shared memory — Gandalf curates.

**Why:** Research showed the orchestrator should own the workflow and context curation. Superpowers follows this pattern. Gandalf needs defined behavior for each status code, clear dispatching guidelines, and memory management to function as an effective orchestrator.

### 4. Quest Log (Cross-Session Memory)

Single file at `docs/fellowship/quest-log.md`. Format:

```markdown
# Active Quest: [Feature Name]

**Started:** YYYY-MM-DD
**Last updated:** YYYY-MM-DD
**Design spec:** `docs/fellowship/specs/YYYY-MM-DD-topic-design.md`
**Plan:** `docs/fellowship/plans/YYYY-MM-DD-feature.md`

## Completed
- [x] [Companion] — [what they did]

## Current
- [ ] [Companion] — [what they're doing] (branch: feature-branch)

## Next
- [ ] [Companion] — [what they'll do]

## Open Questions
- [anything deferred]
```

**Updated at session boundaries.** At session start, Gandalf reads the quest log to understand where things stand. During work, steps get marked complete. At session end (or when switching quests), the log gets updated.

**One active quest at a time.** Completed quests get their status changed to "Completed" with a date, keeping the log as a living record.

**Why:** This solves the concrete pain point experienced in this project — "where did we leave off?" Neither Claude Code's native auto-memory nor design specs provide this. The quest log is the simplest possible solution: one file, human-readable, updated manually. It serves as an index that points to specs and plans — Gandalf follows the pointers to get full decision context when needed.

### 5. Learnings Log (Episodic Memory)

Single file at `docs/fellowship/learnings.md`. Append-only, date-grouped, categorized.

```markdown
# Fellowship Learnings

## 2026-03-22
- [engineering] Turso DB's batch API silently drops statements over 1000 chars — must chunk.
- [tooling] `npm test -- --filter` doesn't work with vitest config — use `npx vitest run src/path`.
- [process] Tier 2 was the right call for the auth feature.
```

**Why this exists:**

Our three-layer memory design (native auto-memory, per-agent memory, fellowship shared memory) covers semantic memory (facts, decisions) and procedural memory (plans, task lists) but had no mechanism for episodic memory — things discovered during execution that aren't part of the plan but would be valuable in future sessions.

Research (Mastra Observational Memory, A-MEM, claude-mem) consistently identified this as a critical gap. Examples of knowledge that would otherwise be lost:
- A library API that doesn't work as documented
- A codebase quirk not obvious from reading the code
- A test command that needs a specific format in this project
- A process observation about what tier worked well

**How it integrates:**
- Gandalf reads it at session start alongside the quest log
- Gandalf appends to it when significant observations surface during execution
- Companions can contribute by including observations in DONE_WITH_CONCERNS reports — Gandalf decides whether to persist them
- Categories (engineering, tooling, process, codebase, preference) make it scannable

**What we chose NOT to build:**
- No vector DB or semantic search (overkill at our scale)
- No background Observer/Reflector agents (can't run background agents in Claude Code)
- No linked note graphs (insufficient volume to warrant it)
- No compression system (our agents are short-lived, no growing context window problem)

### 6. Memory Architecture (Three Layers)

| Layer | What | Where | Managed by |
|---|---|---|---|
| Native auto-memory | User preferences, build commands, working style | `~/.claude/projects/<project>/memory/` | Claude Code (automatic) |
| Per-agent memory | Agent-specific working knowledge | `~/.claude/agent-memory/<name>/` | Each agent via `memory: project` frontmatter |
| Fellowship shared memory | Quest log, learnings, specs, plans | `docs/fellowship/` | Gandalf (curator) + skills (writers) |

**Gandalf as memory curator:** When dispatching agents, Gandalf reads the quest log, learnings, and relevant specs, then includes only what matters in the dispatch prompt. Agents don't search for shared memory themselves — Gandalf curates what they need.

**Why:** Research consistently showed retrieval quality matters more than storage sophistication. Gandalf-as-curator is more token-efficient and requires zero infrastructure (no vector DB, no MCP memory service). Validated by Mastra's research (observations matter more than summaries) and the broader file-based memory consensus (works well up to ~5MB).

**Stale spec management:** Dates in filenames (e.g., `2026-03-22-dashboard-design.md`) are sufficient for agents to determine which spec is current. No deletion logic or status fields needed. If an agent reads an old spec, the date tells them it's old, and the current code is the source of truth. Revisit if this causes problems.

### 7. Tier-Aware Artifact Generation

Brainstorming (the conversation) is always valuable when there are real decisions to make. But formal written artifacts (design spec, implementation plan) should scale to the complexity:

- **Tier 1 (Direct)** — Brainstorm conversation → build directly. No written spec or plan. The decisions live in the conversation and in the code.
- **Tier 2+ (One companion or more)** — Brainstorm conversation → write design spec → write plan → execute.

The brainstorming skill does the right thing automatically based on the tier, without asking the user. The user can always override ("write a spec for this" or "just build it").

**Why:** Experienced during this session — writing a design spec and plan for a single skill file is ceremony that doesn't match the complexity. The brainstorming conversation was valuable, but the formal artifacts added overhead without proportional value for Tier 1 work.

### 8. Deferred (Not Building Now)

| Item | Why deferred |
|---|---|
| Decision records (ADR format) | Design specs already capture decisions. Separate ADRs add formality without solving a current problem. |
| Conventions file | Claude's native auto-memory partially covers this. Agents can discover conventions from code. |
| Lessons directory | Learnings log handles the episodic memory need. A separate lessons directory with individual files is overkill. |
| Memory garbage collection | Not enough memory accumulated to need it. Revisit when it becomes a problem. |

## Approaches Considered

### Option A: Principles-only engineering skill
No reporting protocol. Gimli writes whatever he wants when done. **Rejected because:** Gandalf can't make routing decisions from unstructured free-text reports. Every working multi-agent system has structured worker output.

### Option B: Principles + reporting protocol (Selected)
Engineering principles for craft quality. Structured reporting format for orchestration. **Selected because:** Gives Gimli freedom in how he works while giving Gandalf predictable communication. Balances token budget (~800-1200 tokens) with sufficient guidance.

### Option C: Principles + workflow stages
Prescribed stages: understand → find patterns → build → self-review → verify → report. **Rejected because:** The orchestrator should own the workflow, not the worker. Stages consume context tokens without improving output. Rigid sequences can't adapt to unusual situations.

### Vector DB / MCP memory service
Semantic search over persistent memories. **Rejected because:** Overkill for a file-based plugin. Contradicts "light and non-intrusive" philosophy. Requires running infrastructure. Gandalf-as-curator achieves the same goal with zero dependencies.

### TDD as iron law (Superpowers approach)
Mandate "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST." **Rejected because:** Creates test sprawl for simple work. Fellowship has Pippin (Test Engineer) for dedicated testing work, so Gimli doesn't need to be a TDD zealot. Verification is mandatory; new tests are a judgment call based on complexity and criticality.

### Mastra-style Observer/Reflector agents
Background agents that compress observations into memory. **Rejected because:** Can't run background agents in Claude Code's architecture. The overhead isn't justified at our scale. A simple append-only learnings file captures the same episodic knowledge without infrastructure.

### Four memory artifact types (quest log + decisions + conventions + lessons)
Full memory architecture from initial research. **Simplified to:** quest log + learnings log. Design specs already capture decisions. Auto-memory partially covers conventions. One learnings file replaces the separate lessons directory.

## Sources

### Multi-Agent Orchestration
- Anthropic: "How we built our multi-agent research system" / "Building Effective AI Agents"
- Anthropic: "Effective Harnesses for Long-Running Agents" / "Measuring Agent Autonomy"
- Claude Code docs: sub-agents, memory, hooks
- Superpowers plugin: subagent-driven-development, implementer-prompt, spec-reviewer-prompt
- OpenAI Agents SDK, LangGraph, CrewAI multi-agent patterns
- Steve Kinney: "Sub-Agent Anti-Patterns and Pitfalls"

### Engineering Principles
- Addy Osmani: "My LLM Coding Workflow Going Into 2026"
- Armin Ronacher: "Agentic Coding Recommendations"
- CodeScene: "Agentic AI Coding Best Practice Patterns"
- Simon Willison: "Agentic Engineering Patterns" (Feb 2026)
- MIT Missing Semester 2026: "Agentic Coding"
- Anthropic: "Claude Code Best Practices"
- Wiz Research: "Secure AI Vibe Coding with Rules Files"

### Memory Architecture
- Mastra: "Observational Memory" research (94.87% on LongMemEval)
- A-MEM: Agentic Memory for LLM Agents (NeurIPS 2025)
- Memory surveys: arXiv:2512.13564, arXiv:2603.10062, ICML 2025 Collaborative Memory
- claude-mem plugin architecture
- File-based memory consensus (2025-2026)
