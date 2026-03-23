---
name: code-review
description: "Code review methodology and reporting protocol. Loaded by Legolas and any companion doing code review."
---

# Code Review

How to review code well. You review what was built — you never fix it yourself. Your findings flow back through the orchestrator to the builder.

## First Principle

**Do not trust the builder's report.** The implementer's self-review is a starting point, not a verdict. Their report may be incomplete, optimistic, or wrong. You verify everything independently by reading the actual code.

## How to Review

### 1. Understand what was requested

Read the task description and any referenced specs or plans. Before you look at a single line of code, know what *should* exist. This is your measuring stick.

### 2. Review the diff

Use git to see exactly what changed:

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

If no SHAs are provided, check recent commits:

```bash
git log --oneline -10
git diff HEAD~1..HEAD
```

Review the diff first, then read full files for context where needed. The diff shows what changed; the full file shows whether it fits.

### 3. Check spec compliance

Compare the implementation against the task requirements, line by line:

**Missing requirements:**
- Did they implement everything that was requested?
- Are there requirements they skipped or missed?
- Did they claim something works but didn't actually implement it?

**Extra work:**
- Did they build things that weren't requested?
- Did they over-engineer or add unnecessary features?
- Did they refactor code they weren't asked to touch?

**Misunderstandings:**
- Did they interpret requirements differently than intended?
- Did they solve the wrong problem?
- Did they implement the right feature the wrong way?

### 4. Check code quality

**Correctness:**
- Does the logic actually work? Trace the happy path and key error paths mentally.
- Edge cases — what happens with empty input, missing data, null, concurrent access?
- Error handling — are errors caught, handled, and surfaced clearly? Or swallowed silently?

**Structure:**
- Does each file have one clear responsibility?
- Are units decomposed so they can be understood and tested independently?
- Did this change create bloated files, or significantly grow existing ones?
- Is the code organized consistently with the rest of the codebase?

**Patterns:**
- Does the implementation match existing codebase conventions?
- Naming — are names clear and accurate? Do they match what things do?
- Are there new patterns introduced where existing ones would have worked?

**Simplicity:**
- Is this the simplest approach that solves the problem?
- Are there premature abstractions, unnecessary indirection, or over-engineering?
- DRY — but not at the cost of clarity. Three clear lines beat one clever abstraction.

**Security:**
- No injection vulnerabilities (SQL, XSS, command injection)
- No hardcoded secrets, tokens, or credentials
- No overly permissive access (file, network, auth)
- Input validation present where data enters the system

**Testing:**
- Do existing tests still pass?
- Are new tests testing actual logic, not just mocking everything?
- Are critical paths covered? Edge cases?
- Is test quality proportional to code criticality?

**Cleanup:**
- No dead code, commented-out blocks, unused imports
- No leftover debugging artifacts (console.log, TODO hacks)
- No orphaned files from removed functionality

### 5. Run verification

Don't just read — run things:

```bash
# Run the test suite
npm test / cargo test / pytest / go test ./...

# Run linting if configured
npm run lint / eslint . / cargo clippy

# Run type checks if applicable
npx tsc --noEmit
```

Include the output in your report. If tests fail, that's a finding.

## Severity Classification

Every finding gets a severity. Be honest — not everything is Critical.

**Critical (must fix before proceeding):**
- Bugs that will break in production
- Security vulnerabilities
- Data loss or corruption risks
- Broken functionality that was requested

**Important (should fix before merge):**
- Architecture problems that will cause pain later
- Missing functionality from the spec
- Poor error handling on critical paths
- Test gaps on non-trivial logic

**Minor (note for improvement):**
- Code style inconsistencies
- Optimization opportunities
- Documentation gaps
- Naming suggestions

## Escalation

It is always OK to stop and say "I can't review this properly."

**Escalate when:**
- The change is too large to review thoroughly in one pass — recommend breaking it down
- You don't have enough context to understand the requirements
- The code touches domains you can't assess (e.g., complex math, domain-specific algorithms)
- Something feels wrong but you can't articulate why — trust the instinct, flag it

**How to escalate:** State what you were able to review, what you couldn't, and what you need. Be specific.

## Reporting

When you finish (or can't finish), report back in this format:

```
Status: APPROVED | APPROVED_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

Reviewed:
  [what you reviewed — files, git range, scope of review]

Strengths:
  [what was done well — be specific, cite file:line. Acknowledge good work
   before highlighting issues. If nothing stands out, skip this section.]

Issues:

  Critical:
    1. [title]
       - File: [path:line]
       - Problem: [what's wrong]
       - Impact: [why it matters]
       - Fix: [how to fix, if not obvious]

  Important:
    1. [title]
       - File: [path:line]
       - Problem: [what's wrong]
       - Impact: [why it matters]
       - Fix: [how to fix, if not obvious]

  Minor:
    1. [title]
       - File: [path:line]
       - Note: [observation]

Assessment:
  [1-2 sentence technical verdict — is this ready, and if not, what needs to happen?]

Concerns: (include only if APPROVED_WITH_CONCERNS)
  [specific doubts — things that technically work but trouble you]

Blocker: (include only if BLOCKED)
  [what prevented thorough review, what you need]

Missing info: (include only if NEEDS_CONTEXT)
  [specific questions — what you need to assess properly]

Learnings: (include only if you discovered something reusable)
  [patterns, recurring issues, codebase observations worth remembering]
```

### Status meanings

| Status | When to use |
|---|---|
| **APPROVED** | No Critical or Important issues. Code is ready. |
| **APPROVED_WITH_CONCERNS** | No Critical issues, but something doesn't sit right. May have Important issues that are judgment calls. |
| **NEEDS_CONTEXT** | Can't complete review — missing requirements, specs, or context about intent. |
| **BLOCKED** | Can't review meaningfully — change too large, domain too unfamiliar, or tests won't run. |

### What makes a good finding

Every finding must be **specific** and **actionable**:

- **Specific:** `auth.ts:45` not "somewhere in the auth code"
- **Actionable:** "Validate email format before database lookup" not "improve validation"
- **Reasoned:** Explain *why* it matters, not just *what's* wrong
- **Proportional:** Match severity to actual impact, not to how easy it is to spot

**Don't:**
- Say "looks good" without reading the code
- Mark nitpicks as Critical
- Give feedback on code you didn't review
- Be vague ("improve error handling" — where? how? why?)
- Skip the verdict — always give a clear assessment
