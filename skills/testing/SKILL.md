---
name: testing
description: "Testing methodology and reporting protocol for test engineering work. Loaded by Pippin and any companion doing dedicated testing."
---

# Testing

How to test things well. You write tests from what the code *should* do — the specification — not from what it *does*. This independence is your value. If the builder's implementation has a bug, your tests catch it because you derived expectations from the spec, not the code.

## First Principle

**Tests are a specification, not a mirror.** Every test you write answers the question: "according to the requirements, what should happen?" If you find yourself reading the implementation to decide what to assert, stop. Go back to the spec. The builder wrote the code; you write the contract it must honor.

## Three Modes

You operate in whichever mode Gandalf specifies in your dispatch. If not specified, default to test-after.

### Mode 1: Test-After (most common)

Gimli has built something. Legolas may have flagged test gaps. Your job:

1. **Read the spec/task description first.** Understand what was requested — inputs, outputs, edge cases, error conditions. This is your source of truth.
2. **Derive test cases from the spec**, not from reading the implementation. List what should be true if the feature works correctly.
3. **Then read the implementation** — only to understand the interfaces (function signatures, API endpoints, component props). You need to know how to call the code, not how it works internally.
4. **Write the tests.** Run them. Report results.

If your spec-derived tests fail against the implementation, that's a finding — the implementation may be wrong, or the spec may need updating. Report it; don't adjust your tests to match the code.

### Mode 2: Test-First (TDD)

Gandalf dispatches you before Gimli builds. Your job:

1. **Read the spec/task description.** Understand what will be built.
2. **Write failing tests** that express the spec as assertions. These tests define the contract Gimli must fulfill.
3. **Verify they fail** (red). If they pass before implementation exists, something is wrong — your tests aren't testing anything.
4. **Report back.** Gimli receives your test files and implements against them.

Test-first tests should be:
- Focused on behavior, not implementation details
- Written against public interfaces (function signatures, API contracts, component props)
- Independent of each other — no test should depend on another's side effects
- Clear enough that Gimli understands exactly what the code must do

### Mode 3: Test Infrastructure

Setting up or improving the testing foundation. Your job may include:

- Framework configuration (vitest, jest, playwright, cypress)
- Shared fixtures and factories
- Test helper utilities and custom matchers
- Mock/stub implementations for external dependencies
- CI pipeline test configuration
- Coverage tooling and thresholds

This is planned work, not reactive. Treat it like any implementation task — understand the current state, build incrementally, verify it works.

## What to Test

**Test pyramid — prefer the base:**

| Level | What | When | Speed |
|---|---|---|---|
| **Unit** | Pure functions, data transformations, business logic, utilities | Always — this is your bread and butter | Fast |
| **Integration** | Module interactions, API routes with real handlers, database queries | When units alone can't verify the contract | Medium |
| **E2E** | Full user flows through the real UI | Critical paths only — login, checkout, core workflows | Slow |

**Focus your effort:**
- Business logic — the rules that make the product work
- Data transformations — inputs in, outputs out, edge cases at the boundaries
- Error paths — what happens when things go wrong? Missing data, invalid input, network failures, permission denied
- Edge cases — empty arrays, null values, boundary numbers, concurrent access, Unicode, timezone shifts
- Critical paths — auth, payments, data mutations, anything where failure costs money or trust

**Don't waste tests on:**
- Framework boilerplate (does Next.js route to the right page? Yes. It always does.)
- Simple getters/setters with no logic
- Third-party library behavior (test *your* usage, not *their* code)
- CSS and styling (unless layout-critical behavior depends on it)
- Configuration that's verified by the framework at startup

## How to Write Good Tests

**Each test has one reason to fail.** If a test can fail for three different reasons, it's three tests wearing a trenchcoat.

**Name tests as assertions about behavior:**
- `it('returns empty array when user has no orders')`
- `it('rejects amounts exceeding daily limit')`
- `it('retries failed webhook delivery three times')`
- Not: `it('test getOrders')`, `it('works correctly')`, `it('handles edge case')`

**Arrange, Act, Assert.** Set up the state, perform the action, check the result. Keep each section visually distinct. If a test needs 30 lines of arrangement, the code under test may need a simpler interface — or you need a factory.

**Test behavior, not implementation.** Assert on outputs and observable effects, not internal state. If you're reaching into private fields or mocking internal methods, you're testing the wrong thing. When the implementation changes (and it will), your tests should only break if the behavior actually changed.

**Keep tests independent.** No shared mutable state between tests. Each test sets up what it needs and cleans up after itself. Test order must not matter.

## Fixtures, Factories, and Mocks

Use the lightest tool that serves the test:

| Tool | When | Example |
|---|---|---|
| **Inline data** | Simple, one-off test values | `const user = { name: 'Ada', role: 'admin' }` |
| **Factories** | Repeated object creation with variations | `createUser({ role: 'admin' })` with sensible defaults |
| **Fixtures** | Shared static data (JSON files, seed data) | `fixtures/valid-webhook-payload.json` |
| **Mocks** | External dependencies you can't or shouldn't call | API clients, email services, payment processors |
| **Stubs** | Controlled return values for dependencies | Database returning a specific result set |

**Mock boundaries, not internals.** Mock at the edges — HTTP clients, databases, file systems, external APIs. Never mock the module you're testing. If you're mocking internal functions to make tests pass, the code needs refactoring, not more mocks.

**Real over fake when practical.** If you can test against a real database (SQLite in-memory, test container), prefer it over mocking every query. Mocked tests can pass while production burns — the mock doesn't know the schema changed.

## Running and Diagnosing

**Always run the full suite after writing tests.** Your new tests should pass, and existing tests should still pass. If existing tests break, understand why before changing them.

**When a test fails, classify it:**

| Classification | What happened | Your action |
|---|---|---|
| **Spec violation** | The code doesn't do what the spec says | Report as a finding — the implementation needs fixing |
| **Test error** | Your test has a bug (wrong setup, bad assertion) | Fix the test |
| **Spec ambiguity** | The spec doesn't clearly define this behavior | Report as NEEDS_CONTEXT — ask for clarification |
| **Flaky** | Passes sometimes, fails sometimes | Investigate — race condition, timing, external dependency? Stabilize or quarantine |

**Never make a test pass by weakening the assertion.** If the test says the response should have 3 items and the code returns 2, don't change the test to expect 2. Investigate which is correct.

## Escalation

It is always OK to stop and say "I can't test this properly."

**Escalate when:**
- The spec is ambiguous — multiple valid interpretations lead to different test expectations
- The code has no clear public interface — everything is tightly coupled, no seam to test through
- External dependencies can't be reasonably mocked (complex state machines, undocumented APIs)
- The test infrastructure doesn't support what's needed (missing framework, no database access)
- You're unsure whether a failure is a spec violation or a test error

**How to escalate:** State what you can test, what you can't, and what you need. Be specific.

## Reporting

When you finish (or can't finish), report back in this format:

```
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

What was tested:
  [concise description of what you tested and why — trace back to spec/requirements]

What was NOT tested:
  [explicit gaps — what you chose not to test and why. Omit only if everything was covered.]

Files changed:
  [list of file paths — created, modified, or deleted]

Test results:
  [pass/fail counts, coverage delta if measurable]
  [exact commands you ran and summary of output]

Findings: (include if tests revealed spec violations or implementation issues)
  1. [title]
     - Test: [test name or file:line]
     - Expected: [what the spec says should happen]
     - Actual: [what the code does]
     - Assessment: [spec violation | test error | spec ambiguity]

Concerns: (include only if DONE_WITH_CONCERNS)
  [specific doubts — things that technically pass but trouble you]

Blocker: (include only if BLOCKED)
  [what's blocking you, what you tried, what help you need]

Missing info: (include only if NEEDS_CONTEXT)
  [specific questions — what you need to know to proceed]

Learnings: (include only if you discovered something reusable)
  [testing patterns, framework quirks, coverage gaps worth remembering]
```

**Keep reports concise.** Commit your test files and report paths. The reviewer reads the actual tests — don't paste full test suites into the report.
