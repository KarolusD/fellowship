---
name: engineering
description: "Engineering principles and reporting protocol for implementation work. Loaded by Gimli and any companion doing implementation."
---

# Engineering

How to build things well. These are principles, not steps — adapt your approach to the situation, but always report back in the defined format.

## Principles

**Understand before building.** Read the task fully. Explore the codebase. Find 2-3 similar implementations and use them as reference for patterns, naming, structure, and error handling. If no similar code exists (greenfield or new pattern), be deliberate — whatever you build becomes the convention others will follow.

**Match existing patterns.** Follow the codebase's conventions. Don't invent new patterns when existing ones work. If you see a consistent way errors are handled, data is validated, or files are organized — match it. When existing patterns have problems that affect your work, improve them as part of the change. Don't refactor unrelated code.

**Simplicity first.** Prefer the simplest approach that solves the problem. Functions over classes. Flat over nested. Concrete over abstract. Don't build for hypothetical future requirements. Three similar lines of code are better than a premature abstraction.

**Build incrementally.** One logical change at a time. Verify each step works before moving to the next. Small, working increments are easier to debug than large, broken ones.

**Keep checks local.** Auth, validation, permissions, error handling — keep them visible where the action happens. Don't hide critical checks in distant middleware or base classes where they're easy to miss and hard to verify.

**No dead code.** Clean up after yourself. No commented-out code, unused imports, orphaned files, or placeholder stubs. If you remove functionality, remove it completely.

**Verify your work.** Run existing tests to confirm nothing broke. Write new tests only for non-trivial logic, data transformations, and critical paths. For config, copy, and styling — running the app and showing the result is sufficient verification. Verification is mandatory; new tests are a judgment call.

## Self-Review

Before reporting, verify your own work:

- Does this fulfill the requirement? Re-read the task and check.
- Does this match existing patterns? Compare against the references you found.
- Edge cases — what happens with empty input, missing data, concurrent access?
- Error paths — do failures produce clear messages? Are errors handled, not swallowed?
- No dead code, no duplication, no leftover debugging artifacts.
- Security — no injection, no hardcoded secrets, no overly permissive access.
- Scope — only changed what was asked. No unrelated "improvements."
- Tests — existing tests pass. New tests written where warranted. Run them and include the output.

## Escalation

Bad work is worse than no work. It is always OK to stop and say "I need help."

**Escalate when:**
- Requirements are ambiguous and multiple interpretations are valid
- Multiple approaches could work and the tradeoffs aren't clear-cut
- The change is high-impact or destructive (data migrations, auth changes, public API modifications, deleting files/branches)
- Your confidence is low — something feels wrong but you can't pin it down
- You've been stuck on the same problem and your attempts aren't converging

**How to escalate:** State what you know, what you don't know, and what you need. Be specific. "I'm unsure about the approach" is not helpful. "The spec says X but the existing code does Y, and I don't know which to follow" is.

## Reporting

When you finish (or can't finish), report back in this format:

```
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

What was built:
  [concise description of what you implemented or attempted]

Files changed:
  [list of file paths — created, modified, or deleted]

Verification:
  [exact commands you ran and their output — tests, linting, type checks]

Concerns: (include only if DONE_WITH_CONCERNS)
  [specific doubts with reasoning — what might be wrong and why]

Blocker: (include only if BLOCKED)
  [what's blocking you, what you tried, what help you need]

Missing info: (include only if NEEDS_CONTEXT)
  [specific questions — what you need to know to proceed]

Learnings: (include only if you discovered something reusable)
  [detailed observations that would help future work — library quirks, codebase
   constraints, tooling gotchas, environment issues. Be specific and detailed;
   the orchestrator will decide whether to persist these.]
```

**Keep reports concise.** For large implementations, commit your work and report file paths. The reviewer reads the actual files — don't paste full implementations into the report.
