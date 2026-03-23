# The Fellowship — Architecture Design Spec

**Date:** 2026-03-19 (updated 2026-03-20)
**Status:** Draft — revised after Phase 1 research and design
**Author:** Karolus (Frodo) + Claude (Gandalf)

---

## 1. Overview

The Fellowship is a LotR-themed Claude Code plugin for solo product development. It replaces Superpowers with a system that adds specialized agents, project memory, design workflows, and a memorable identity — while porting Superpowers' proven workflow patterns.

**Target user:** Solo product developer — designer, builder, engineer. Works on complex full-stack products (React, Convex/Postgres, AI integrations, design systems). Often design-led — may start with UX, then move to implementation — but also does pure engineering, backend work, and vibe coding.

**Core insight:** Skills are shared knowledge. Agents are specialized workers who apply it. The orchestrator (Gandalf) lives in CLAUDE.md — always present, never dispatched.

---

## 2. Key Decisions

### 2.1 Frodo Is the User

The Fellowship of Nine = 8 agents + the human (Frodo). Frodo carries the Ring (the product). There is no Frodo agent. The Fellowship serves the Ring-bearer.

**Why:** Every role in the system is covered by other characters. Frodo's unique trait (carrying the Ring when no one else can) maps to the human's burden of product ownership — not an agent's job.

### 2.2 Gandalf — Orchestrator with Multiple Entry Points

Gandalf lives in `agents/gandalf.md` and `skills/fellowship/SKILL.md`. He's the orchestrator — he brainstorms, plans, and dispatches companions. Four ways to activate:

1. **Mid-session** — `/fellowship` loads Gandalf's methodology as a skill. Conversational, keeps context, can dispatch agents. The lightest activation.
2. **Per-project default** — `{"agent": "fellowship:gandalf"}` in `.claude/settings.json`. Every session in that project starts with Gandalf as the main agent.
3. **One-off session** — `claude --agent fellowship:gandalf`. Full Gandalf from the terminal.
4. **Auto-dispatch** — Claude sees companion descriptions and dispatches them automatically when tasks match.

A light SessionStart hook injects a bootstrap: "The Fellowship is available. Invoke `/fellowship` when building something new." This ensures Claude knows the Fellowship exists without being intrusive.

**Why not CLAUDE.md:** Users have their own CLAUDE.md. The bootstrap hook is additive.

**Personality approach:** Role-reinforcing traits only. Gandalf is wise, patient, conservative with resources, guides rather than does.

### 2.2a Gandalf Handles Planning

Gandalf brainstorms and plans directly — in-session, no agent dispatch needed. The flow: brainstorm → plan → dispatch agents.

**Merry** (Technical Architect) is reserved for **deep architecture only** — data models, system design, API boundaries. When architecture questions come up during brainstorming, Gandalf loads Merry's `architecture` skill in-session. When deep design work is needed, Gandalf dispatches Merry as an agent.

### 2.3 Dual-Layer Architecture: Skills + Agents

Every Fellowship member exists as both a skill (shared knowledge) and an agent (specialized worker). These are DIFFERENT things:

- **Skill** = the handbook. Methodology, process, standards. Rich content. Can be loaded by Gandalf directly (in-session thinking) or by any agent.
- **Agent** = the worker. Thin file defining: role description, tool scoping, memory, which skills to load. Dispatched for independent work.

**Why:** The article principle — "Skills are the shared library of expertise. Subagents are the specialists who apply it." Skills enhance agents because agents can load skills that aren't "theirs." Gimli building UI loads the design skill. Legolas reviewing auth loads the security skill.

### 2.4 Character Personality in Prompts — Role-Reinforcing Only

Research shows irrelevant persona details can degrade LLM output by up to 30%. But role-reinforcing personality (traits that align with the task) improves performance.

**The rule:** Character traits that reinforce professional values are included. Random backstory is not.

Example (Gimli agent):
```
You are Gimli, the Fellowship's engineer. You build with the pride
of a dwarf craftsman — solid, reliable, meant to endure. You don't
ship half-finished work or brittle shortcuts.
```

**LotR flavor lives in:** README, slash commands, output framing, plugin branding. NOT in paragraphs of backstory in system prompts.

### 2.5 Agent Frontmatter (Verified)

Claude Code agent `.md` files support 15 frontmatter fields (verified via official docs, March 2026):

`name`, `description`, `tools` (allowlist), `disallowedTools`, `model`, `skills` (preload by name), `memory` (`project`/`user`/`local`), `mcpServers`, `maxTurns`, `permissionMode`, `hooks`, `effort`, `background`, `isolation`

**Security restriction:** `hooks`, `mcpServers`, and `permissionMode` are silently ignored for plugin-provided agents. Users must copy agents to `.claude/agents/` for these to work.

**Subagent constraint:** Agents dispatched via the Agent tool CANNOT spawn further subagents. Only standalone agents (`claude --agent X`) can orchestrate multi-agent chains.

### 2.5a Tool Scoping Per Agent

The `tools` field is a confirmed allowlist. Each agent gets only what they need.

| Agent | Tools | Rationale |
|---|---|---|
| Gimli | Read, Write, Edit, Glob, Grep, Bash | Full implementation |
| Legolas | Read, Edit, Glob, Grep, Bash | Modifies existing, cannot create new files |
| Pippin | Read, Write, Edit, Glob, Grep, Bash | Creates test files |
| Arwen | Read, Glob, Grep + Figma MCP | Design tools, not code |
| Sam | Read, Glob, Grep, WebSearch, WebFetch | Research only |
| Aragorn | Read, Glob, Grep, Edit | Reads and refines docs |
| Merry | Read, Glob, Grep, Edit | Architecture docs |
| Boromir | Read, Glob, Grep, Bash | Reads code, runs security checks |
| Bilbo | Read, Glob, Grep, Edit | Reads and refines text |

### 2.6 MCP Scoping Per Agent

Confirmed: subagents can access MCP servers, and can have MCP servers the main session doesn't. Arwen gets Figma MCP without polluting other agents' context.

**Caveat:** Plugin-provided agents cannot use the `mcpServers` field (security restriction). Agents must be in `.claude/agents/` for MCP scoping to work. The plugin provides agent templates; users copy them to their project.

### 2.7 Project Memory as First-Class Feature

Superpowers is stateless between sessions. Fellowship remembers.

Three memory layers:
1. **CLAUDE.md** — Gandalf's always-loaded project context (product identity, current state, routing rules)
2. **Agent memory** (`memory: project`) — each agent accumulates domain-specific knowledge across sessions via persistent MEMORY.md
3. **Architecture Decision Records** (`docs/decisions/`) — version-controlled decisions readable by humans and agents

### 2.8 Fellowship Replaces Superpowers

Not a complement — a replacement. Fellowship ports Superpowers' proven workflow skills (brainstorming, planning, TDD, debugging, code review, verification) and adds: product thinking, security, design, UX writing, user research, project memory, agent specialization, identity.

Superpowers is MIT licensed. Workflow patterns will be ported and improved, not copied verbatim.

---

## 3. The Roster

### Fellowship of Nine (8 agents + Frodo the user)

| Character | Role | As Skill (in session) | As Agent (dispatched) |
|---|---|---|---|
| Gandalf | Orchestrator | — (IS the session) | — (never dispatched) |
| Aragorn | Product Manager | "Should we build this? What's the scope?" | "Analyze this PRD, produce requirements" |
| Merry | Technical Architect | "What's the right approach here?" | "Design the data model for this feature" |
| Gimli | Engineer | Less common — he builds things | "Implement this feature" |
| Legolas | QA Engineer | Less common — needs fresh eyes | "Review and refactor this module" |
| Boromir | Security Engineer | "Check this code for security issues" | "Full security audit of this project" |
| Pippin | Test Engineer | Less common — produces verbose output | "Write tests for this module" |
| Sam | User Researcher | "Quick question about competitors" | "Full market analysis for this space" |

### Allies (not Fellowship members, invoked selectively)

| Character | Role | As Skill | As Agent |
|---|---|---|---|
| Arwen | Product Designer | "What design pattern fits here?" | "Explore 3 layout variants in Figma" |
| Bilbo | UX Writer | "Improve this error message" | "Review all copy in this module" |

---

## 4. Skills Map

Skills are domain knowledge — shared, composable, independently loadable.

### Character-mapped skills (invoked via slash commands)

| Skill | Slash command | Primary agent | Also used by |
|---|---|---|---|
| product-strategy | `/aragorn` | Aragorn | Gandalf (in session) |
| architecture | `/merry` | Merry | Gimli (when designing), Gandalf |
| engineering | — | Gimli | Legolas (review against standards) |
| code-review | `/legolas` | Legolas | Gandalf (quick review) |
| security | `/boromir` | Boromir | Legolas (auth code review) |
| tdd | `/pippin` | Pippin | Gimli (inline tests) |
| design | `/arwen` | Arwen | Gimli (UI work) |
| ux-writing | `/bilbo` | Bilbo | Arwen (copy in designs) |
| research | `/sam` | Sam | Gandalf (quick research) |

### Gandalf's skills (orchestrator methodology)

| Skill | Purpose | Ported from |
|---|---|---|
| brainstorming | Idea → design spec through collaborative dialogue | Superpowers: brainstorming (improved) |
| planning | Spec → implementation plan with quest log and task breakdown | Superpowers: writing-plans (improved) |

### Workflow skills (ported from Superpowers, no character mapping)

| Skill | Purpose | Ported from |
|---|---|---|
| debugging | Systematic root-cause analysis before fixing | Superpowers: systematic-debugging |
| verification | Evidence-based verification before claiming done | Superpowers: verification-before-completion |
| git-worktrees | Isolated worktrees for feature work | Superpowers: using-git-worktrees |
| branch-completion | Merge/PR/keep/discard workflow | Superpowers: finishing-a-development-branch |
| review-feedback | Handling code review feedback with rigor | Superpowers: receiving-code-review |

---

## 5. Tiered Routing

Gandalf classifies task weight before acting.

### Tier 1 — Direct (no overhead)
Gandalf handles it alone. Brainstorming, planning, quick fixes, questions, simple edits.

**Trigger:** Task is a single concern, requires conversation context, takes <2 minutes.

### Tier 2 — One specialist (minimal overhead)
Gandalf loads a skill (in-session thinking) or dispatches one agent (independent work).

**Trigger:** Task needs domain expertise OR produces artifacts independently.

**Examples:**
- "Review this copy" → load `/bilbo` skill (quick, in session)
- "Implement the stepper component" → dispatch Gimli agent
- "Is this approach secure?" → load `/boromir` skill
- "Full security audit" → dispatch Boromir agent

**Decision logic:** Needs my conversation context? → Skill. Independent work? → Agent.

### Tier 3 — Sequential chain (3-5 min overhead)
Agent output feeds the next agent. Gandalf orchestrates handoffs.

**Trigger:** Task spans multiple domains in sequence.

**Quest log:** Gandalf creates a task list upfront before dispatching anyone. Each step marked complete only after verification — not after starting.

```
Quest: Implement user profile feature
├── ⬜ Aragorn — define requirements and scope
├── ⬜ Merry — design data model and API
├── ⬜ Gimli — implement feature
├── ⬜ Legolas — review and refactor
```

**Examples:**
- New feature: Aragorn (requirements) → Merry (architecture) → Gimli (build)
- Research-driven build: Sam (research) → Aragorn (decisions) → Gimli (build)
- Design-to-code: Arwen (design) → Gimli (implement) → Legolas (review)

### Tier 4 — Parallel agents (8-15 min overhead)
Multiple agents work simultaneously on independent concerns.

**Trigger:** Task has genuinely independent sub-tasks. User explicitly requests or Gandalf identifies safe parallelism.

**Quest log:** Same upfront task list, but with parallel branches visible.

```
Quest: Explore dashboard layouts
├── 🔄 Arwen (variant A) — minimal sidebar
├── 🔄 Arwen (variant B) — full navigation
├── ✅ Arwen (variant C) — tab-based
└── ⬜ Gandalf — compare and recommend
```

**Gandalf never defaults to Tier 4.** He classifies conservatively and only escalates with evidence.

**Examples:**
- Arwen exploring 3 layout variants in parallel
- Gimli building feature + Pippin writing tests for existing code
- Sam researching competitors while Arwen sketches initial concepts

### Why Tiering Matters (vs Superpowers)

Superpowers has no tiers. Its rule is: "If you think there is even a 1% chance a skill might apply, you ABSOLUTELY MUST invoke the skill." Every task gets the full ceremony — brainstorming → planning → TDD → review → verification. No exceptions.

For a solo dev who sometimes needs to make a quick fix or vibe code, this is heavy. Fellowship's tiered routing means:
- **Tier 1 tasks stay fast.** "Fix this typo" → Gandalf just does it. No brainstorming, no TDD, no review.
- **Tier 3-4 tasks get full discipline.** "Build the new dashboard" → quest log, sequential agents, verification gates.

The discipline exists where it matters. It doesn't tax you on simple tasks.

---

## 6. Plugin Structure

```
fellowship/
  .claude-plugin/
    plugin.json                     ← plugin metadata, name, version

  hooks/
    hooks.json                      ← lifecycle hook definitions
    session-start/                  ← injects Gandalf's context on every session
    pretooluse-skill-inject.mjs     ← auto-loads skills by file/command context

  skills/
    product-strategy/SKILL.md       ← /aragorn
    architecture/SKILL.md           ← /merry
    engineering/SKILL.md            ← gimli's handbook
    code-review/SKILL.md            ← /legolas
    security/SKILL.md               ← /boromir
    tdd/SKILL.md                    ← pippin's handbook
    design/SKILL.md                 ← /arwen
    ux-writing/SKILL.md             ← /bilbo
    research/SKILL.md               ← /sam
    debugging/SKILL.md              ← workflow (ported from superpowers)
    verification/SKILL.md           ← workflow (ported from superpowers)
    git-worktrees/SKILL.md          ← workflow (ported from superpowers)
    branch-completion/SKILL.md      ← workflow (ported from superpowers)
    review-feedback/SKILL.md        ← workflow (ported from superpowers)

  agents/
    aragorn.md                      ← PM worker
    merry.md                        ← architecture worker
    gimli.md                        ← engineer worker
    legolas.md                      ← QA worker
    pippin.md                       ← test worker
    arwen.md                        ← design worker (+ Figma MCP)
    sam.md                          ← research worker
    boromir.md                      ← security worker
    bilbo.md                        ← UX writing worker

  docs/
    decisions/                      ← architecture decision records
```

---

## 7. Hook System

### SessionStart
Fires on: `startup`, `clear`, `compact`

Injects a light Fellowship bootstrap (`hooks/fellowship-bootstrap.md`) — NOT Gandalf's full identity. The bootstrap contains:
- The agent roster (who does what, when to dispatch)
- The skill menu (available skills and when to use each)
- Brief "how it works" guidance

Gandalf's personality activates on demand through the brainstorming and planning skills, or via standalone mode (`claude --agent gandalf`).

### PreToolUse (skill injection)
Fires on: `Read`, `Edit`, `Write`, `Bash`

Matches tool targets against skill patterns:
- File patterns: `.tsx` files → suggest design skill, auth files → suggest security skill
- Bash patterns: test commands → suggest tdd skill

### UserPromptSubmit (intent detection)
Fires on: every user message

Can read the full user prompt. Used for keyword/pattern matching to suggest relevant skills or agents. Not a full intent classifier — uses regex/keyword matching, same fundamental approach as Superpowers but with additional signal from the prompt text.

---

## 8. Memory System

### Layer 1: CLAUDE.md (Gandalf's context)
Always loaded. Contains:
- Product identity and current state
- Key architectural decisions
- Active work items and priorities
- Routing rules and agent roster

### Layer 2: Agent memory (`memory: project`)
Each agent has a persistent MEMORY.md scoped to the project. First 200 lines auto-injected on agent start.

Use cases:
- Legolas remembers code patterns he's flagged before
- Arwen remembers design directions explored and rejected
- Gimli remembers implementation patterns used in this project
- Sam remembers research findings

### Layer 3: Architecture Decision Records
`docs/decisions/YYYY-MM-DD-<topic>.md`

Version-controlled. Readable by humans and agents. For decisions that are:
- Hard to reverse
- Frequently referenced
- Need to survive beyond any single tool's memory system

---

## 9. What Fellowship Ports from Superpowers

| Superpowers Skill | Fellowship Equivalent | Changes |
|---|---|---|
| using-superpowers | Gandalf session-start | Character-driven, not meta-skill |
| brainstorming | Gandalf directly | Built into orchestrator, not a separate skill |
| writing-plans | architecture skill (Merry) | Themed, architecture-focused |
| subagent-driven-development | Gandalf dispatching named agents | Named agents with scoped tools |
| executing-plans | Gandalf orchestration | Same pattern, themed |
| test-driven-development | tdd skill (Pippin) | Dedicated character |
| systematic-debugging | debugging skill | Ported, improved with Merry collaboration |
| requesting-code-review | Legolas auto-dispatched | Named reviewer with memory |
| receiving-code-review | review-feedback skill | Ported |
| verification-before-completion | verification skill | Ported |
| finishing-a-development-branch | branch-completion skill | Ported |
| using-git-worktrees | git-worktrees skill | Ported |
| dispatching-parallel-agents | Gandalf Tier 4 routing | Named agents |
| writing-skills | TBD — skill for extending Fellowship | Port later |
| code-reviewer agent | Legolas agent | Scoped tools, memory, personality |

---

## 10. What Fellowship Adds (Not in Superpowers)

| Capability | Fellowship Feature |
|---|---|
| Product thinking | Aragorn (skill + agent) |
| Security review | Boromir (skill + agent + auto-hooks on auth files) |
| Design workflows | Arwen (skill + agent + Figma MCP scoping) |
| UX writing | Bilbo (skill + agent) |
| User research | Sam (skill + agent) |
| Project memory | 3-layer system (CLAUDE.md, agent memory, ADRs) |
| Tool scoping | Per-agent allowlists |
| MCP scoping | Per-agent MCP server access |
| Character identity | Memorable names, themed commands, role-reinforcing personality |
| Design-first workflow | Native support for design-led development |

---

## 11. Phased Rollout

Build incrementally. Add companions as you feel the gap.

### Phase 1: Gandalf + Gimli
- CLAUDE.md with Gandalf's personality and routing rules
- Plugin skeleton (hooks, session-start)
- Gimli agent + engineering skill
- Test on Senscience project

### Phase 2: Thinking Skills
- Aragorn skill (product strategy)
- Merry skill (architecture)
- Slash commands working

### Phase 3: Quality Gates
- Legolas agent + code-review skill
- Boromir skill (security)
- Auto-hooks for security on auth file changes

### Phase 4: Design + Copy
- Arwen agent + design skill + Figma MCP scoping
- Bilbo skill (UX writing)

### Phase 5: Research + Testing
- Sam agent + research skill
- Pippin agent + tdd skill
- Ported workflow skills (debugging, verification, git-worktrees, branch-completion)

### Phase 6: Polish
- All agents as both skills and agents
- Review-feedback skill
- Writing-skills skill (for extending Fellowship)
- Public release preparation

---

## 12. Open Questions (for future brainstorming)

1. **Boromir auto-hooks:** What file patterns trigger automatic security review? Just auth files, or broader?
2. **Arwen parallel variants:** Mechanically, how does Gandalf spawn 3 Arwen agents with different briefs and collect results?
3. **Skill injection patterns:** What are the right file-pattern and bash-pattern matches for each skill?
4. **CLAUDE.md template:** What's the minimal Gandalf context that works for any project vs what's project-specific?
5. **Agent-to-agent handoff format:** When Aragorn's output feeds Merry, what's the structured format for that artifact?
6. **Community customization:** How do users add their own characters or skills to the Fellowship?
