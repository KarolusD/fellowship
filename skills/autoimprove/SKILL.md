# AutoImprove — Agent Improvement Loop

You are running an autonomous improvement loop for a Fellowship agent. You operate entirely inside a git worktree. The live `agents/` directory is never touched. Every change is committed or reverted — nothing is lost.

**Read this file fully before starting. Then follow the 8-step loop exactly.**

**CRITICAL: Every action step requires actual tool use — not reasoning about it, not describing it.**
- File reads → use the Read tool
- File writes and edits → use the Write or Edit tool
- Running Python → use the Bash tool: `python evals/<target>/hard.py`
- Git commands → use the Bash tool. Showing a git command in your response is not enough. Run it.

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

**CRITICAL: Do not simulate responses internally.** Simulation produces circular results — the same model that wrote the agent instructions also knows what "correct" looks like. Real invocations are required. Each scenario must invoke a fresh, isolated claude process.

For each scenario in `scenarios.jsonl`:

**1. Invoke the agent directly** using the Bash tool. Run this Python script for each scenario (substituting actual target and scenario values):

```bash
python3 << 'PYEOF'
import subprocess, json

target = "<target>"  # e.g. "gimli"
scenario_json = '<paste full scenario JSON line here>'
scenario = json.loads(scenario_json)

# Build prompt: full agent file + optional context + scenario input
agent_instructions = open(f"agents/{target}.md").read()
prompt = agent_instructions + "\n\n---\n\n"
if scenario.get("context"):
    prompt += f"Context: {scenario['context']}\n\n"
prompt += scenario["input"]

# Fresh invocation — no conversation history, no loop awareness
result = subprocess.run(
    ["claude", "--dangerously-skip-permissions", "--print", prompt],
    capture_output=True, text=True, timeout=120
)
response = result.stdout.strip()

# Save for assertion runner
open("/tmp/fellowship_eval_response.txt", "w").write(response)
open("/tmp/fellowship_eval_scenario.json", "w").write(scenario_json)

print(f"=== RESPONSE (scenario {scenario['id']}) ===")
print(response[:600] + "..." if len(response) > 600 else response)
PYEOF
```

Run once per scenario. Response is saved to `/tmp/fellowship_eval_response.txt`.

**2. Run hard assertions** using the Bash tool:

```bash
# Use the PROTECTED copy — never evals/<target>/hard.py directly
python3 /tmp/fellowship_eval_<target>_hard.py \
  /tmp/fellowship_eval_scenario.json \
  < /tmp/fellowship_eval_response.txt
```

The protected copy was placed at `/tmp/fellowship_eval_<target>_hard.py` by the runner before the worktree was created. It cannot be modified by this loop.

**3. If `soft.md` exists:** for each assertion line, judge it using the Bash tool:

```bash
python3 << 'PYEOF'
import subprocess

assertion = "<assertion text from soft.md>"
response = open("/tmp/fellowship_eval_response.txt").read()
prompt = f"Assertion: {assertion}\nResponse: {response}\n\nAnswer with only TRUE or FALSE."

result = subprocess.run(
    ["claude", "--print", prompt],
    capture_output=True, text=True, timeout=60
)
verdict = result.stdout.strip().upper()
print(f"{'PASS' if verdict.startswith('TRUE') else 'FAIL'}: {assertion[:80]}")
PYEOF
```

**4. Record:** `{scenario_id, assertion_name, passed, response_preview}` for each assertion.

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

**Timing note:** Real invocations take 15–30 seconds each. A full baseline across all scenarios takes 5–15 minutes. This is expected and correct. Do not shortcut by simulating.

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
Use the Bash tool to run:
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
Use the Bash tool to run:
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

Use the Bash tool to commit the summary:
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
- **Do not modify `evals/<target>/hard.py`, `evals/<target>/soft.md`, or `evals/<target>/scenarios.jsonl`.** These are the measurement tool, not the lever. The loop improves `agents/<target>.md` only.
- Run assertions against `/tmp/fellowship_eval_<target>_hard.py` (the protected copy) — never the one in `evals/<target>/hard.py`, which could have been inadvertently changed.
- Do not read or modify files outside this worktree (except `/tmp/fellowship_eval_*` files placed there by the runner).
- Do not push to remote. The human reviews and merges in the morning.
