# Engineering Skill — Research Notes

**Date:** 2026-03-20
**Status:** Research complete, ready to write
**Next step:** Write `skills/engineering/SKILL.md`

---

## Context

The engineering skill is Gimli's primary handbook — methodology for building things well. It's loaded by the engineer agent and potentially by other agents doing implementation work.

## Superpowers' Approach

Superpowers has no dedicated engineering skill. The methodology is spread across 16 files:

- `subagent-driven-development/implementer-prompt.md` — implementation instructions for dispatched subagents
- `subagent-driven-development/SKILL.md` — dispatch orchestration, two-stage review (spec compliance + code quality)
- `subagent-driven-development/spec-reviewer-prompt.md` — checks missing/extra requirements
- `subagent-driven-development/code-quality-reviewer-prompt.md` — architecture, file responsibility, patterns
- `test-driven-development/SKILL.md` — "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
- `verification-before-completion/SKILL.md` — "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
- `systematic-debugging/SKILL.md` — "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST" + 3 supporting files
- `executing-plans/SKILL.md` — inline execution methodology
- `agents/code-reviewer.md` — 6 review dimensions (plan alignment, code quality, architecture, docs, issues, communication)
- `requesting-code-review/code-reviewer.md` — production readiness checklist

### Superpowers' "Iron Laws"
1. TDD: No production code without a failing test first
2. Debugging: No fixes without root cause investigation first
3. Verification: No completion claims without fresh verification evidence

### Superpowers' Subagent Status Reports
- DONE — task complete, all tests pass
- DONE_WITH_CONCERNS — complete but has doubts
- NEEDS_CONTEXT — can't proceed without more info
- BLOCKED — stuck, needs help

### Superpowers' Two-Stage Review
1. Spec compliance review (did you build what was asked?)
2. Code quality review (is the code good?)

---

## Web Research Findings

### Engineering Agent Best Practices (2025-2026)

**Implementation methodology (Addy Osmani, IBM):**
- Spec before code — "waterfall in 15 minutes"
- Break work into small, focused chunks
- Spend ~70% on specifications, ~10% on execution
- Force thinking/reasoning before code (reduces hallucination ~40%)
- Include non-goals to prevent scope creep

**Code quality in agentic workflows (Armin Ronacher, CodeScene, IEEE):**
- Agents produce 2x concurrency errors vs human code
- Agents produce 3x readability issues
- Common failures: abstraction bloat, dead code accumulation, assumption propagation
- Prefer simplicity: functions over classes, plain SQL over ORMs
- Keep important checks (auth, validation) local and visible
- Agents perform best in healthy codebases (Code Health 9.5+)

**Self-review patterns (multiple sources):**
- Fresh-context self-review catches mistakes effectively
- Multi-level safeguards: during generation, pre-commit, PR pre-flight
- Evidence-based review: cite evidence for every finding
- Coverage as behavioral guardrail to prevent test deletion

**Working in existing codebases (Pete Hodgson, JetBrains, Augment Code):**
- Agents arrive as "brand new hires" each session
- Provide in-line examples — LLMs excel at mimicry
- Be directive, not open-ended
- Feed environmental signals (linter errors, test output) back to agent
- Find 2-3 similar implementations as reference before modifying
- Match existing indentation, naming, structure

**Report format (Claude Code docs, community):**
- Subagents work best as information collectors with concise summaries
- Include: what was done, files changed, verification results, issues/decisions
- Use file system as memory — store detailed reports as markdown

**Escalation (Anthropic research, community):**
- LLMs are biased toward forcing solutions rather than stopping
- Escalate on: ambiguous requirements, missing specs, multiple valid approaches, high-impact operations, low confidence
- Claude Code asks for clarification 2x more on complex vs simple tasks
- Format: state what you know, what you don't know, what you need

### Sources
- Addy Osmani — "My LLM Coding Workflow Going Into 2026"
- Addy Osmani — "The 80% Problem in Agentic Coding"
- Armin Ronacher — "Agentic Coding Recommendations"
- CodeScene — "Agentic AI Coding Best Practice Patterns"
- Pete Hodgson — "Why Your AI Coding Assistant Keeps Doing It Wrong"
- JetBrains — "Coding Guidelines for Your AI Agents"
- Anthropic — "Measuring AI Agent Autonomy"
- IEEE Spectrum — "AI Coding Degrades: Silent Failures Emerge"
- Stack Overflow — "Are Bugs Inevitable with AI Coding Agents?"

---

## Fellowship Engineering Skill — Design

### What to include

| Section | Content | Source |
|---|---|---|
| **Understand before building** | Read the task, explore code, find similar implementations | Web research + Superpowers |
| **Match existing patterns** | Find 2-3 references in codebase, match conventions | Web research |
| **Simplicity first** | Functions over classes, no abstraction bloat, YAGNI | Web research (Ronacher) |
| **Build incrementally** | One logical change at a time, verify each step | Web research (Osmani) |
| **Keep checks local** | Auth, validation, permissions visible in handlers | Web research |
| **No dead code, no duplication** | Clean up after yourself | Web research |
| **Self-review checklist** | Re-read requirement, check patterns, edge cases, errors | Both |
| **Verification with evidence** | Run tests, show output, don't claim without proof | Superpowers |
| **Escalation protocol** | DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT | Superpowers |
| **Report format** | What was built, files changed, verification, concerns | Both |

### What NOT to include (other skills)

| Topic | Why excluded | Where it lives |
|---|---|---|
| TDD methodology | Pippin's domain | `skills/tdd/SKILL.md` |
| Debugging methodology | Separate workflow skill | `skills/debugging/SKILL.md` |
| Code review standards | Legolas's domain | `skills/code-review/SKILL.md` |
| Plan execution orchestration | Planning skill + Gandalf | `skills/planning/SKILL.md` |
| Security review | Boromir's domain | `skills/security/SKILL.md` |

### Key design principle

The skill should be ~150-300 words of focused guidance per section (web research suggests LLM reasoning degrades around 3,000 tokens of instruction). Keep it tight. Gimli is a skilled craftsman — he needs principles, not scripts.
