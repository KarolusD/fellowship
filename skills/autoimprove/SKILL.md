# AutoImprove — Agent Improvement Loop

You are running an autonomous improvement loop for a Fellowship agent. You operate entirely inside a git worktree. The live `agents/` directory is never touched. Every change is committed or reverted — nothing is lost.

**Read this file fully before starting. Then follow the 8-step loop exactly.**

---

## Setup

Your working directory is a git worktree. All paths below are relative to it.

Files you will read and write:
- `agents/<target>.md` — the file being improved
- `evals/<target>/scenarios.jsonl` — test inputs (one JSON object per line)
- `evals/<target>/hard.py` — deterministic assertions
- `evals/<target>/soft.md` — qualitative assertions (may not exist)
- `evals/<target>/history.jsonl` — cycle log (append each cycle)
- `evals/<target>/session-summary.md` — write at the end

---

## The 8-Step Loop

### Step 1 — READ

Read all five files listed above for the target agent. If `soft.md` does not exist, note that — soft scoring is skipped for this agent.

Load `history.jsonl` to understand what has been tried before. Do not repeat discarded hypotheses.

---

### Step 2 — BASELINE

For each scenario in `scenarios.jsonl`:

1. Simulate: given this `input` (and `context` if present), what would `<target>` respond? Produce a realistic response as if you were that agent following its current `agents/<target>.md` instructions.
2. Run `hard.py` assertions against the simulated response:
   - Call `run_assertions(response)` from `hard.py` — this returns `{assertion_name: bool}`.
   - Or evaluate each assertion function manually if you cannot execute Python.
3. If `soft.md` exists: for each assertion line in `soft.md`, judge it TRUE or FALSE using `claude-haiku-4-5` (or the fastest available model). Pass the assertion as a yes/no question with the response text. Keep soft assertions simple — one plain sentence, binary answer.
4. Record: `{scenario_id, assertion_name, passed, response_preview}` for each assertion.

Calculate scores:
- `hard_score` = (assertions passing across all scenarios) / (total assertions × scenarios)
- `soft_score` = (soft assertions passing across all scenarios) / (total soft assertions × scenarios) — only if `soft.md` exists
- `overall`:
  - If `soft.md` exists: `(hard_score * 0.7) + (soft_score * 0.3)`
  - If no `soft.md`: `overall = hard_score`

Append baseline entry to `evals/<target>/history.jsonl`:

```json
{
  "run_id": "<ISO timestamp>",
  "cycle": 0,
  "hard_score": 0.00,
  "soft_score": null,
  "overall": 0.00,
  "top_failing_assertion": "<name>",
  "change_applied": "baseline",
  "hypothesis": "baseline — no change",
  "outcome": "baseline",
  "commit": null
}
```

---

### Step 3 — FIND TARGET

Look across all scenarios and all assertions. Which assertion fails most often?

That is the target for this cycle. If two assertions fail equally, pick the one with higher behavioral impact (format failures before voice failures).

---

### Step 4 — PROPOSE

Write ONE change to `agents/<target>.md` that directly addresses the failing assertion.

Rules:
- Change exactly ONE thing: one sentence, one example, one anti-pattern added, one rule clarified.
- Add a hypothesis comment directly above the change in the file:
  ```
  # hypothesis: [specific claim about what this change should fix]
  ```
- Do not change unrelated sections.
- Do not remove existing content unless it directly contradicts the fix.

---

### Step 5 — EVALUATE

Re-run all scenarios against the changed version of `agents/<target>.md`. Calculate new `hard_score`, `soft_score`, and `overall` using the same method as Step 2.

---

### Step 6 — DECIDE

Compare new `overall` to the previous cycle's `overall`.

**If improved:**
```bash
git add agents/<target>.md evals/<target>/history.jsonl
git commit -m "exp: +N% <assertion_name> — <hypothesis summary>"
```
Where `N` is the percentage point improvement (e.g. `+7% no_survey_question — named example added`).

Append to `evals/<target>/history.jsonl`:
```json
{
  "run_id": "<ISO timestamp>",
  "cycle": <N>,
  "hard_score": <new>,
  "soft_score": <new or null>,
  "overall": <new>,
  "top_failing_assertion": "<name>",
  "change_applied": "<one-line description of what changed in the agent file>",
  "hypothesis": "<the hypothesis comment text>",
  "outcome": "kept",
  "commit": "<short git hash>"
}
```

**If worse or unchanged:**
```bash
git revert HEAD --no-edit
```
Append to `evals/<target>/history.jsonl`:
```json
{
  "run_id": "<ISO timestamp>",
  "cycle": <N>,
  "hard_score": <new>,
  "soft_score": <new or null>,
  "overall": <new>,
  "top_failing_assertion": "<name>",
  "change_applied": "<one-line description of what was tried>",
  "hypothesis": "<the hypothesis comment text>",
  "outcome": "discarded",
  "commit": null
}
```

---

### Step 7 — REPEAT

Go back to Step 3.

**Stop when any of these is true:**
- `overall` ≥ 0.85
- 25 cycles completed (or the `--cycles N` value passed by the runner)
- No failing assertions remain

---

### Step 8 — REPORT

Write `evals/<target>/session-summary.md`:

```markdown
# AutoImprove Session — <target> — <date>

## Result
- Cycles run: <N>
- Starting score: <baseline overall>
- Ending score: <final overall>
- Improvement: +<delta>%

## Changes That Held
| Cycle | Assertion | Hypothesis | Commit |
|-------|-----------|------------|--------|
| <N> | <assertion_name> | <hypothesis> | <hash> |

## Changes Discarded
| Cycle | Assertion | Hypothesis | Reason |
|-------|-----------|------------|--------|
| <N> | <assertion_name> | <hypothesis> | no improvement |

## Notes
<Any observations about plateaus, conflicting changes, or assertions that proved resistant>
```

Commit the summary:
```bash
git add evals/<target>/session-summary.md evals/<target>/history.jsonl
git commit -m "exp: session summary — <target> <date>"
```

---

## Soft Assertion Judging (LLM-as-judge)

Use `claude-haiku-4-5` (or the fastest/cheapest available model) for soft assertions. Do not use a large model — these are simple binary judgments.

For each soft assertion line in `soft.md`, send a prompt like:

```
Assertion: <assertion text from soft.md>
Response: <agent response text>

Answer with only TRUE or FALSE.
```

Soft assertions in `soft.md` are written as yes/no questions. A TRUE answer means the assertion passes. A FALSE answer means it fails.

Keep soft assertions simple. If an assertion requires aesthetic judgment or nuanced interpretation, it should not be in `soft.md`. The spec author already wrote them to be Haiku-compatible.

---

## Scoring Reference

| Situation | Formula |
|-----------|---------|
| `soft.md` exists | `(hard * 0.7) + (soft * 0.3)` |
| No `soft.md` | `overall = hard_score` |
| Target pass rate | ≥ 0.85 |

---

## Safety

- You are in a git worktree. The live project is not affected.
- Every cycle either commits or reverts. Nothing is left in limbo.
- `--dangerously-skip-permissions` was passed by the runner — you have full file access in this worktree.
- Do not read or modify files outside this worktree.
- Do not push to remote. The human reviews and merges in the morning.
