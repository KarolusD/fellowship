# Pippin Implementation Plan

**Date:** 2026-03-23
**Goal:** Build Pippin (Test Engineer) agent + testing skill, update Gimli's boundary, validate with end-to-end test.

## Steps

### 1. Create `skills/testing/SKILL.md`
The testing skill — Pippin's craft methodology. Covers all three modes (test-after, test-first, infrastructure). Includes:
- How to read a spec and derive test cases (specification-driven, not implementation-derived)
- Test pyramid guidance (unit > integration > E2E)
- What to test vs what not to test (business logic yes, framework boilerplate no)
- Fixtures, factories, mocks — when each is appropriate
- Running tests, diagnosing failures, classifying results
- Reporting format (4-status + test-specific additions)
- Escalation guidance

Pattern reference: `skills/engineering/SKILL.md` and `skills/code-review/SKILL.md` for structure and tone.

### 2. Create `agents/pippin.md`
Pippin's identity — personality, role, boundaries, what he does and doesn't do. Follows the pattern from `agents/gimli.md` and `agents/legolas.md`:
- Frontmatter: name, description, tools, skills, memory
- Role section: dispatched by Gandalf, works from specs
- Boundaries: doesn't make product decisions, doesn't refactor production code, doesn't do security audits
- Personality: curious, thorough, "but what if...?" instinct

### 3. Update `skills/engineering/SKILL.md`
Tighten Gimli's testing boundary:
- "Verify your work" principle: clarify that Gimli **runs** existing tests and may write simple inline tests for pure functions
- Explicitly state that comprehensive test suites, integration tests, E2E tests, and test infrastructure are Pippin's domain
- Keep the self-review checklist's testing check, but scope it to "existing tests pass"

### 4. Update `skills/orchestration/SKILL.md`
Add Pippin dispatch patterns to the orchestration skill:
- When to dispatch Pippin (after Legolas flags gaps, before Gimli for complex logic, standalone for infrastructure)
- The test-first workflow: Pippin → Gimli → Legolas
- The test-after workflow: Gimli → Legolas → Pippin → (optional Legolas re-review)
- How to include spec context in Pippin's dispatch

### 5. Update roster in README and quest log
- Update the companion table in README.md
- Rename skill from `tdd` to `testing` in the roster table
- Update quest log

### 6. End-to-end validation
Use a real (small) task to test the full cycle:
- Pick something concrete in the Fellowship codebase that needs a test
- Dispatch Gimli to build it → Legolas to review → Pippin to add tests
- Verify the dispatch flow, reporting, and SendMessage handoffs work

## Order of operations

Steps 1-2 can be done in parallel (skill + agent are independent).
Step 3-4 depend on step 1 (need to know the skill's exact scope).
Step 5 is cleanup after 1-4.
Step 6 requires everything else complete.

## What "done" looks like

- `skills/testing/SKILL.md` exists with full methodology
- `agents/pippin.md` exists with identity + boundaries
- Gimli's engineering skill has tightened test boundary
- Orchestration skill has Pippin dispatch patterns
- One successful Gandalf → Gimli → Legolas → Pippin cycle on a real task
