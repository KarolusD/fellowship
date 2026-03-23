# Fellowship Roster Review — Design Spec

**Date:** 2026-03-23
**Status:** Active
**Trigger:** Before building Legolas, review all agent roles for fit, overlap, and missing coverage.

## Context

The Fellowship has 9 companions + 2 allies. Before building more agents, we reviewed every role for:
- Clear, non-overlapping responsibilities
- Practical value for a solo developer
- Accurate titles that match actual work
- Lore fit (the Nine walk together — this is a design constraint)

## Decisions

### 1. Legolas — Renamed from "QA Engineer" to "Code Reviewer"

**Problem:** "QA Engineer" implies test strategy, regression plans, test infrastructure — which is Pippin's territory. Legolas's actual work is code review, not QA.

**Decision:** Legolas is a **pure code reviewer**. He reviews, he doesn't fix.

**Role definition:**
- Reviews Gimli's work for spec compliance AND code quality (combined into one pass, unlike Superpowers' two-stage approach)
- Reports findings with file:line references, severity categorization, fix suggestions
- Does NOT edit or write code — findings go back through Gandalf to Gimli
- Tools: Read, Glob, Grep, Bash (for running tests/lints — no Edit, no Write)
- Skill: `code-review`

**Why pure reviewer (no fix authority):**
- Separation of concerns prevents bias — a reviewer who also fixes gravitates toward fixable issues rather than the most important ones
- Forces clear communication of what's wrong and why (structured findings)
- Prevents scope creep in reviews (reviewer starts "improving" unrelated things)
- Creates a natural feedback loop where Gimli improves based on review
- Aligned with Superpowers' proven model (their reviewers never fix code)

**Severity categorization (adopted from Superpowers):**

| Severity | Definition |
|---|---|
| **Critical** | Bugs, security issues, data loss risks, broken functionality |
| **Important** | Architecture problems, missing features, poor error handling, test gaps |
| **Minor** | Code style, optimization opportunities, documentation improvements |

**Lore fit:** Elven eyes that never miss — spotted threats from miles away, competed with Gimli at Helm's Deep. The competition with Gimli IS the review cycle. Perfect.

### 2. The Gimli → Legolas Review Cycle

**Research basis:** Superpowers' subagent-driven-development uses a strict review loop:
- Reviewer finds issues → Implementer fixes → Reviewer re-reviews → repeat until approved
- The implementer (same subagent) handles fixes via SendMessage (preserves context)
- Reviews are never skipped once started

**Fellowship's review cycle:**

```
Gandalf → Agent(gimli)    → Gimli builds, reports
Gandalf → Agent(legolas)  → Legolas reviews, reports findings
IF issues found:
  Gandalf → SendMessage(gimli) with findings → Gimli fixes, reports
  Gandalf → Agent(legolas) re-reviews
  → repeat until approved
Task complete
```

**Key rules:**
- Gandalf decides WHETHER to dispatch Legolas (not all work needs review)
- Once review starts, the cycle runs to completion — no skipping re-review
- Gimli stays alive via SendMessage — preserves context of what he built
- Legolas does spec compliance + code quality in one pass (not two stages like Superpowers)

**When Gandalf dispatches Legolas:**
- Critical paths: auth, payments, data mutations, public APIs — always
- New features with meaningful logic — usually
- Config changes, copy updates, simple fixes — skip review

**Superpowers comparison:**
| Aspect | Superpowers | Fellowship |
|---|---|---|
| Review stages | Two (spec compliance, then code quality) | One combined pass |
| Reviewer fixes code? | Never | Never |
| Re-review after fixes? | Always | Always |
| Review mandatory? | Every task | Gandalf's judgment per task |
| Implementer stays alive? | Yes (SendMessage) | Yes (SendMessage) |
| Severity tiers | Critical / Important / Minor | Same |

### 3. Aragorn — Product Manager (confirmed, with clarification)

**Concern raised:** Solo devs ARE the product person. Does Aragorn produce artifacts no one reads, or challenge thinking?

**Decision:** Aragorn's value is as a **sparring partner**, not a document factory. He:
- Challenges scope ("do we actually need this?")
- Pressure-tests priorities ("what's the cost of not doing X?")
- Finds gaps in requirements ("what happens when the user has no org?")
- Writes specs only when the complexity warrants it (Tier 2+)

Used when: starting a new feature, evaluating scope, making build-vs-skip decisions.

### 4. Merry — Technical Architect (confirmed)

No changes. Decides how to build before Gimli builds. Clean separation.

### 5. Boromir — Security Engineer (confirmed)

No changes. Distinct domain, no overlap.

### 6. Pippin — Test Engineer (confirmed, fully designed)

**Problem:** Gimli currently writes some tests as part of verification, and Legolas flags test gaps during review. But neither writes tests from the specification — they derive tests from the implementation, which means bugs in the code become bugs in the tests. A dedicated testing companion provides the independence that catches what the builder misses.

**Decision:** Pippin is a **specification-driven test engineer**. He writes tests from what the code *should* do (the spec), not from what it *does* (the implementation).

**Research basis:**
- [Autonoma](https://www.getautonoma.com/blog/ai-coding-agent): "When you ask an AI coding agent to write tests for the code it just wrote, the tests are derived from the code, not from the specification. Relying on your coding agent for your testing strategy is like relying on your architect to do the building inspection."
- [undeadlist/claude-code-agents](https://github.com/undeadlist/claude-code-agents): Splits testing into test-writer + test-runner + browser-qa — three separate agents. Fellowship combines writer + runner into Pippin (solo dev doesn't need that granularity).
- [lst97/claude-code-sub-agents](https://github.com/lst97/claude-code-sub-agents): Splits into test-automator (writes tests, runs on haiku) + qa-expert (strategy/planning, runs on sonnet). Fellowship's Pippin combines both — he writes and thinks.
- Simon Willison's [Agentic Engineering Patterns](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/): Advocates red/green TDD with agents — write failing tests, then implement.
- CodeScene: Without test guardrails, AI adoption produces up to 41% more defects.

**Three modes of operation:**

1. **Test-after (most common dispatch)**
   Gimli builds → Legolas reviews → Legolas flags test gaps → Gandalf dispatches Pippin to fill them.
   Pippin reads the spec/task description, writes tests from that, then runs them against Gimli's code.
   This is reactive — Pippin comes in when review reveals testing isn't adequate.

2. **Test-first (when the task warrants it)**
   For complex logic, data transformations, or anything where the spec can be expressed as assertions — Pippin writes failing tests before Gimli builds. Gimli then implements against Pippin's test suite. True TDD, but only when it serves the work.
   Gandalf decides when to use this mode based on task complexity.

3. **Test infrastructure (planned work)**
   Setting up testing frameworks, creating fixtures, building helpers, configuring CI test pipelines, writing E2E suites. This is planned work, not reactive — goes on the quest log like any feature.

**Boundary with Gimli (updated):**
- Gimli **runs** existing tests (always — part of verification)
- Gimli **writes** simple inline tests when trivially obvious (pure function, data transform — 3-5 lines)
- Gimli does **not** write comprehensive test suites, integration tests, E2E tests, or test infrastructure
- The engineering skill's "verify your work" principle is updated to reflect this boundary

**Boundary with Legolas:**
- Legolas **reviews** whether existing tests cover the right things, flags gaps
- Legolas does **not** write tests — he reports what's missing
- Pippin **writes** the tests Legolas identified as missing
- Pippin's tests may themselves be reviewed by Legolas in a subsequent review cycle

**What Pippin produces:**
- Test files (unit, integration, E2E)
- Test fixtures and factories
- Mock/stub implementations for external dependencies
- Test helper utilities
- Test configuration (vitest.config, jest.config, playwright.config)
- Coverage reports and gap analysis

**Reporting format:**
Same 4-status protocol as other companions (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), with test-specific additions:
- Test results (pass/fail counts, coverage delta)
- What was tested and why (traceability to spec)
- What was NOT tested and why (explicit gaps)

**Personality (lore fit):**
Pippin is curious, thorough, and finds things others overlook — often by accident, sometimes by persistence. He asks "but what if...?" more than anyone else. At Helm's Deep and at the Black Gate, he was where the action was — not because he planned it, but because he followed the thread. His tests follow the same instinct: trace the happy path, then wonder what happens when things go sideways.

**Skill name:** `testing` (renamed from `tdd` — the skill covers all three modes, not just test-first)

**Tools:** Read, Write, Edit, Glob, Grep, Bash (same as Gimli — full implementation toolkit)

**Superpowers comparison:**
| Aspect | Superpowers | Fellowship |
|---|---|---|
| Test mandate | TDD is iron law — no code without failing test | Three modes — Gandalf chooses based on task |
| Who writes tests | Same agent that implements | Dedicated Pippin agent (spec-driven) |
| Test independence | Tests derived from implementation | Tests derived from specification |
| Test infrastructure | Part of implementation work | Dedicated Pippin dispatch (mode 3) |
| Test review | Reviewer checks test adequacy | Legolas reviews tests too |

### 7. Sam — User Researcher (confirmed)

**Concern raised:** Research might work better as a skill than a companion.

**Decision:** Sam stays as a companion. Rationale:
- The Nine walk together (design constraint)
- Research requires distinct tools (WebSearch, WebFetch) that other agents don't need
- Sam's dispatches are infrequent but high-value (initial project phase, user analysis)
- A skill can't search the web — it needs an agent body

### 8. Arwen — Product Designer (confirmed, expanded scope)

**Concrete tools:** Figma Console MCP, official Figma MCP, Pencil MCP

**Two modes of operation:**
1. **Creative mode** — produce design artifacts in Figma, explore visual language, user flows
2. **Evaluative mode** — audit Gimli/Legolas's output:
   - UX audit (user flow, interaction patterns)
   - Accessibility audit (a11y compliance)
   - SEO audit (meta, structure, semantics)
   - Style consistency audit (design system adherence)

### 9. Bilbo — UX Writer (confirmed)

Dispatched rarely. Content improvement, copy polish, user-facing text. The craft is real even if the frequency is low.

### 10. DevOps — No dedicated agent (for now)

**Decision:** Gimli absorbs infrastructure work. For Vercel-first development, most DevOps is config-shaped building — `vercel.json`, env vars, CI/CD pipelines, monitoring setup. That's engineering work.

**If the gap becomes real later:** Elrond is the natural character — Master of Rivendell, maintained the Last Homely House for three thousand years, provided the staging ground that made the quest possible. He'd join as an ally, not a core companion.

## Updated Roster

| | Name | Role | Tools | Skills |
|---|---|---|---|---|
| 🧙 | **Gandalf** | Orchestrator | Agent, SendMessage | orchestration |
| 👑 | **Aragorn** | Product Manager | Read, Glob, Grep, Edit | product-strategy |
| 🍺 | **Merry** | Technical Architect | Read, Glob, Grep, Edit | architecture |
| 🪓 | **Gimli** | Engineer | Read, Write, Edit, Glob, Grep, Bash | engineering |
| 🏹 | **Legolas** | Code Reviewer | Read, Glob, Grep, Bash | code-review |
| 🗡️ | **Boromir** | Security Engineer | Read, Glob, Grep, Bash | security |
| 🍄 | **Pippin** | Test Engineer | Read, Write, Edit, Glob, Grep, Bash | testing |
| 🌻 | **Sam** | User Researcher | Read, Glob, Grep, WebSearch, WebFetch | research |
| 🌟 | **Arwen** | Product Designer | Read, Glob, Grep, Figma MCPs, Pencil MCP | design |
| 📖 | **Bilbo** | UX Writer | Read, Glob, Grep, Edit | ux-writing |

### Changes from original README

1. **Legolas**: "QA Engineer" → "Code Reviewer". Pure reviewer, no fix authority. No Edit/Write tools.
2. **Legolas description**: "Improves existing code, reviews, refactors" → "Reviews code for spec compliance and quality. Spots what others miss. Reports findings — doesn't fix them."
3. **Arwen**: Added evaluative mode (UX/a11y/SEO/style audits) alongside creative mode.
4. **Review cycle**: Documented the Gimli → Legolas → Gimli fix loop with strict re-review.
5. **DevOps gap**: Acknowledged, absorbed by Gimli, Elrond reserved for future if needed.

## Open Questions

- Should the Legolas lore section in the README mention the review cycle with Gimli? The competition at Helm's Deep maps perfectly to the review dynamic.
- Should the review cycle be documented in the README (user-facing) or only in the orchestration skill (internal)?

## Sources

- Superpowers plugin: `agents/code-reviewer.md`, `skills/subagent-driven-development/SKILL.md`, `skills/requesting-code-review/`
- Fellowship research: `docs/fellowship/research.md` (escalation, memory, orchestration sections)
- Fellowship engineering spec: `docs/fellowship/specs/2026-03-22-engineering-skill-design.md`
