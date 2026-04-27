# Codebase Map

**Project:** Fellowship
**Generated:** 2026-04-26
**Stack:** Claude Code plugin — Markdown agents/skills + Bash/Node hooks + Python eval runner

---

## Stack

- **Plugin runtime:** Claude Code (manifest at `.claude-plugin/plugin.json`, version `1.0.0`)
- **Marketplace registration:** `.claude-plugin/marketplace.json` (mirrors plugin version — bump both together)
- **Agents/skills:** Markdown with YAML frontmatter — no compiler. Claude Code loads them directly.
- **Hooks:** Bash shims (extensionless) under `hooks/` calling Node `.mjs` workers; `hooks/run-hook.cmd` is a polyglot wrapper for Windows compatibility.
- **Eval runner:** Python 3 — `evals/_runner/run_eval.py` (judge-based) and `evals/_runner/improve.sh`.
- **Tests:** Node `node:test` runner — files under `tests/*.test.mjs`. Run: `node --test tests/*.test.mjs`.
- **Health check:** `node hooks/health-check.mjs` — must pass 36/0 after any structural change.
- **Package manager:** none. No `package.json`, no `node_modules`. Uses system Node ≥20 (for `.mjs` test runner) and system Python 3.

## Architecture

A Claude Code plugin. There is no application server, no build step, no compiled output. Claude Code reads agent/skill/hook/command definitions directly from the repo.

**Identity load (SessionStart).** `hooks/run-hook.cmd session-start` runs `hooks/session-start` (Bash, self-contained — there is no `session-start.mjs`). It injects `skills/using-fellowship/SKILL.md` as `<EXTREMELY_IMPORTANT>` with a Gandalf identity wrapper, then appends project-level files from `docs/fellowship/`. The default agent thereafter speaks as Gandalf and routes via tier scoring.

**Dispatch.** Gandalf orchestrates; companion agents are dispatched with the `Agent` tool using the `fellowship:<name>` subagent type (e.g. `fellowship:gimli`). Companions load `agents/_shared/companion-protocol.md` as a shared partial and reach into `agents/references/*.md` for tool-specific recipes (Playwright, Figma MCP recovery, OWASP, structural review, per-companion templates).

**Hook lifecycle.** `SessionStart` (`startup|clear|compact`) runs `session-start` + `fellowship-quest-log-consolidate`. `SessionStart` (`resume`) runs `session-start --resume` only. `PreToolUse` on `Edit|Write|MultiEdit` runs `fellowship-plan-gate` (blocks unplanned implementation). `PostToolUse` runs `fellowship-context-monitor` (async — handoff trigger when context runs low). `SessionEnd` runs `fellowship-session-end` + `fellowship-quest-log-consolidate`.

## Top-level structure

    .claude-plugin/   # Plugin manifest + marketplace registration (single source of truth for version)
    agents/           # 9 companion .md files + _shared/ partial + references/ recipes
    skills/           # 13 skills, one folder each (SKILL.md inside)
    commands/         # 14 slash commands — fellowship-<name>.md → /fellowship:<name>
    hooks/            # SessionStart/PreToolUse/PostToolUse/SessionEnd shims + .mjs workers + health-check
    evals/            # Per-agent scenarios + Python judge runner (_runner/)
    tests/            # Node test suites for hooks/scripts
    templates/        # Boilerplate scaffolded into user projects (currently: ethos.md only)
    docs/fellowship/  # This repo's own dogfooded Fellowship workspace (specs, plans, quest log, this map)
    examples/         # External reference repos (gitignored — not shipped)
    src/              # Legacy throwaway fixtures (gitignored — see Concerns)
    README.md         # Public-facing plugin README
    CHANGELOG.md      # Keep-a-Changelog format
    LICENSE           # MIT

## Manifests

- `.claude-plugin/plugin.json` — authoritative plugin manifest. Contains `name`, `version`, `author`, `repository`, `license`, `keywords`. **Bump `version` on every shipped change** — local plugin edits are invisible to Claude Code until this field changes (cache-bust requirement).
- `.claude-plugin/marketplace.json` — marketplace registration. Mirrors plugin metadata. Keep version in sync with `plugin.json`.

There is no root-level `plugin.json` or `settings.json` (prior versions had them — removed). Tool permissions are governed at the agent level via the `tools:` frontmatter allowlist.

## Hooks layer

`hooks/hooks.json` registers everything. `hooks/hooks-cursor.json` is a Cursor-IDE-specific variant. Always go through `run-hook.cmd` from `hooks.json` — never invoke `.mjs` files directly.

| File | Type | Fires on | Purpose |
|---|---|---|---|
| `hooks/run-hook.cmd` | polyglot wrapper | every hook | Routes Unix → Bash shim, Windows → silent-exit (graceful degradation) |
| `hooks/session-start` | Bash (self-contained, no `.mjs` worker) | SessionStart | Injects Gandalf identity (using-fellowship SKILL) + bootstrap context |
| `hooks/fellowship-bootstrap.md` | Markdown payload | SessionStart (read by `session-start`) | Bootstrap text appended to the identity injection |
| `hooks/fellowship-plan-gate` + `.mjs` | Bash + Node | PreToolUse on Edit/Write/MultiEdit | Blocks implementation when no plan is active |
| `hooks/fellowship-context-monitor` + `.mjs` | Bash + Node | PostToolUse (async) | Triggers handoff when context budget is low |
| `hooks/fellowship-session-end` + `.mjs` | Bash + Node | SessionEnd | Updates quest log, writes session summary |
| `hooks/fellowship-quest-log-consolidate` + `.mjs` | Bash + Node | SessionStart + SessionEnd | Consolidates quest-log entries |
| `hooks/health-check.mjs` | Node (manual) | run via `node hooks/health-check.mjs` | Plugin self-test — must pass 36/0 |

## Skill layer

13 skills under `skills/<name>/SKILL.md`. Tier-2 skills are user-invocable via `/fellowship:<name>` when a matching command file exists.

| Skill | Purpose | Extras |
|---|---|---|
| `accessibility` | Accessibility audit playbook | — |
| `autoimprove` | Self-evaluation + targeted improvement loop for agents/skills | `propose.md`, `report.md` |
| `brainstorming` | Divergent ideation cycle | — |
| `codebase-map` | Generate this file | — |
| `design-it-twice` | Sketch two designs before committing to one | — |
| `grill-me` | Adversarial questioning of a plan or decision | — |
| `investigate` | Bounded investigation of an unknown | — |
| `learn` | Capture a learning into agent memory | — |
| `planning` | Plan-before-build cycle (paired with `plan-gate` hook) | `plan-reviewer-prompt.md` |
| `using-fellowship` | **Gandalf's identity skill** — injected at SessionStart | `references/` (8 files: companions, cycles, voice, tier-scoring, opening-examples, handoff-template, quest-log-format, feedback-log-schema) |
| `using-worktrees` | Worktree-aware companion workflow | — |
| `ux-audit` | UX audit pass | — |
| `visual-exploration` | Generate visual variants from a brief | `scripts/` |

## Agent layer

9 companion agents at `agents/<name>.md`. Each declares a **bare** `name: <name>` in frontmatter (no `fellowship:` prefix — Claude Code adds the plugin namespace at runtime; declaring it twice produces `fellowship:fellowship:<name>` in dispatched-agent labels). Dispatched via `Agent({subagent_type: "fellowship:<name>", ...})`. Gandalf is **not** a file under `agents/` — Gandalf's identity is the `using-fellowship` skill injected at SessionStart.

| Agent | Role | Tools (typical) |
|---|---|---|
| `aragorn.md` | Product strategist | Read, Grep, Glob, Write, WebFetch, WebSearch |
| `arwen.md` | UX writer / microcopy | Read, Edit, Glob, Grep |
| `bilbo.md` | Technical writer (README, changelog, docs) | Read, Write, Edit, Glob, Grep, Bash |
| `boromir.md` | Read-only audit (security/risk) — **no Write/Edit by design** | Read, Grep, Glob, Bash, WebFetch |
| `gimli.md` | Implementation (code) | Read, Write, Edit, Glob, Grep, Bash |
| `legolas.md` | Code review — **no Write/Edit by design** | Read, Grep, Glob, Bash |
| `merry.md` | Architecture / ADR author | Read, Write, Edit, Glob, Grep |
| `pippin.md` | Browser verifier (Playwright) | Read, Bash, Playwright tools |
| `sam.md` | Repo cleanliness / QA / quest-log steward | Read, Write, Edit, Glob, Grep, Bash |

**Shared partials:** `agents/_shared/companion-protocol.md` is referenced by every companion.

**Reference recipes** (`agents/references/`): `aragorn-templates.md`, `arwen-templates.md`, `bilbo-templates.md`, `figma-mcp-recovery.md`, `legolas-structural-review.md`, `merry-templates.md`, `owasp-checklist.md` (Boromir), `pippin-browser-verify.md`, `playwright-tools.md` (Pippin), `sam-templates.md`.

## Commands layer

14 slash commands at `commands/fellowship-<name>.md`, invoked as `/fellowship:<name>`. Most route to a skill or dispatch a companion.

`fellowship:add-ethos`, `fellowship:aragorn`, `fellowship:arwen`, `fellowship:bilbo`, `fellowship:boromir`, `fellowship:brainstorming`, `fellowship:consolidate`, `fellowship:legolas`, `fellowship:map`, `fellowship:merry`, `fellowship:pippin`, `fellowship:planning`, `fellowship:sam`, `fellowship:using-worktrees`.

Naming is hyphen-on-disk → colon-at-prompt: file `fellowship-map.md` is invoked as `/fellowship:map`.

## Eval layer

Per-agent eval suites under `evals/<agent>/`, driven by the Python judge in `evals/_runner/run_eval.py` and the auto-improvement loop `evals/_runner/improve.sh`.

**10 agents have eval suites:** `aragorn`, `arwen`, `bilbo`, `boromir`, `gandalf`, `gimli`, `legolas`, `merry`, `pippin`, `sam`.

**Standard suite per agent:**
- `scenarios.jsonl` — JSONL of eval cases (one case per line)
- `hard.py` — programmatic assertions
- `soft.md` — judge rubric (qualitative criteria)

**Extended suites** (gandalf, gimli, legolas, pippin):
- `holdout.jsonl` — held-out cases never used for tuning
- `history.jsonl` — append-only run history
- `session-summary.md` — most recent eval session writeup

Gandalf additionally carries `assertion-health.jsonl`, `holdout.py`, `holdout_validation.py`, `test_holdout.py`. Pippin additionally carries `assertion-health.jsonl`.

## Test layer

`tests/health-check.test.mjs`, `tests/session-start.test.mjs`, `tests/migration-regression.test.mjs`. Run all via:

    node --test tests/*.test.mjs

The health check itself is a runnable script: `node hooks/health-check.mjs` — should report 27 passed, 0 failed.

## Memory and docs/fellowship

`docs/fellowship/` is both the *template structure* the plugin scaffolds into user projects AND this repo's own dogfooded workspace. Decide which role you're touching before saving.

**Three-layer memory schema:**
- **Specs** (`docs/fellowship/specs/`) — decisions and ADRs. 13 files currently: 4 ADRs (memory-boundary-schema, plan-before-build-hook, worktree-aware-companions, merry-adr-legolas-structural-review), 6 comparison docs, plus eval calibration, v1 improvements, real-usage improvements, quest-log consolidation.
- **Plans** (`docs/fellowship/plans/`) — sequences of work. Live: `2026-04-22-p4-p5-p6-plan.md`, `2026-04-25-mattpocock-skills-adoption.md`. Older plans under `plans/archive/`.
- **Per-agent native memory** (episodic) — handled by Claude Code's native agent memory, scoped via `memory: project` in agent frontmatter.

**Live workspace files:** `quest-log.md` (current), `quest-log-archive.md` (consolidated past), `session-log.md`, `product.md`, `research.md`, `reference-implementations.md`, plus `archive/`, `design/`, `examples/`, `handoffs/`, `templates/`, and a workspace `README.md`.

## Conventions

**Naming:**
- Agent files: lowercase companion name, `.md` (`gimli.md`, not `Gimli.md`)
- Skill folders: lowercase kebab-case (`codebase-map`); inner file is always `SKILL.md`
- Slash commands: `fellowship-<name>.md` on disk → `/fellowship:<name>` at the prompt
- Hook scripts: extensionless Bash shim (`session-start`, not `session-start.sh`); worker is `<name>.mjs` next to the shim
- Node scripts: `.mjs` only (no `package.json` declaring `"type": "module"`)
- **Skill naming inconsistency** — verb skills (`investigate`, `learn`, `grill-me`) coexist with noun skills (`codebase-map`, `accessibility`). Standardization deferred. Do not rename existing skills as a side effect of unrelated work.

**Versioning:** Semver in `.claude-plugin/plugin.json`. Bump on every shipped change — Claude Code caches plugin metadata until the version field changes.

**Agent frontmatter (required for every `agents/*.md`):**

    ---
    name: <lowercase-name>           # bare; Claude Code adds the fellowship: prefix at runtime
    description: [one paragraph + examples block]
    tools: [YAML list — see semantics below]
    model: inherit | sonnet | opus | haiku
    color: red | orange | yellow | green | blue | purple | cyan
    memory: project
    ---

**`tools:` field semantics:**
- Strict allowlist when declared. Listed tools are the ONLY tools the agent can use, including built-ins (TodoWrite, Glob, Grep, Task).
- Omit `tools:` entirely → inherit all tools (Anthropic's `plugin-dev` pattern).
- Fellowship declares explicitly for least privilege. Boromir and Legolas omit Write/Edit on purpose (read-only audit/review).
- Project-level `permissions.allow` controls *prompt confirmation*; it does NOT grant tools to an agent that hasn't listed them.

**Skill frontmatter (required for every `SKILL.md`):**

    ---
    name: <name>
    description: [when to use this skill]
    ---

Some skills also declare `user-invocable: true` and `trigger: /fellowship:<name>` (e.g. `codebase-map`).

**Hook conventions:**
- Always go through `run-hook.cmd` — never invoke `.mjs` directly.
- Bash shim does I/O setup; Node `.mjs` does logic. Keep the shim short.
- Hooks must exit 0 on missing dependencies (graceful degradation).

**Voice/character:**
- Companion `.md` files carry character voice. Gandalf's register is in `skills/using-fellowship/SKILL.md` and `skills/using-fellowship/references/voice.md` — study before editing any companion.
- Artifacts (specs, plans, code, structured output) stay clean and clear — no character voice in produced files.

## Where to add new things

- **New companion agent:** `agents/<name>.md` + entry in `skills/using-fellowship/references/companions.md` + matching `commands/fellowship-<name>.md` if user-invocable. Bump plugin version.
- **New skill:** `skills/<name>/SKILL.md`. If user-invocable, add `commands/fellowship-<name>.md`.
- **New slash command:** `commands/fellowship-<name>.md` (hyphen on disk).
- **New hook:** worker at `hooks/<name>.mjs`, shim at `hooks/<name>` (extensionless Bash), register in `hooks/hooks.json` under the right event matcher.
- **New template (scaffolded into user projects):** `templates/<name>.md`.
- **New eval scenario:** append a JSONL line to `evals/<agent>/scenarios.jsonl`. Holdouts go in `holdout.jsonl`.
- **New test:** `tests/<name>.test.mjs` (uses `node:test`).
- **New companion reference recipe:** `agents/references/<name>.md`, then point the companion at it.
- **New spec/ADR:** `docs/fellowship/specs/YYYY-MM-DD-<slug>.md`. ADRs use `adr-` prefix in the slug.
- **New plan:** `docs/fellowship/plans/YYYY-MM-DD-<slug>.md`.

After any structural change: bump `.claude-plugin/plugin.json` `version`, mirror it in `marketplace.json`, run `node hooks/health-check.mjs` (expect 36/0), run `node --test tests/*.test.mjs`.

## Concerns

- **Two improvements specs may overlap** — `docs/fellowship/specs/2026-04-22-fellowship-real-usage-improvements.md` and `2026-04-26-fellowship-v1-improvements.md`. Confirm one supersedes the other and archive the older.
- **`__pycache__` directories scattered through `evals/`** — gitignored, so harmless, but every Python-touching agent should know they appear after a run.
- **`src/` and `examples/` are gitignored** — `src/__tests__/email.test.ts` looks like a leftover fixture rather than load-bearing code. Confirm before relying on it.
- **Skill naming convention drift** — verb vs noun skills (see Conventions). Tracked, deferred.
- **Cache-bust requirement is convention-only** — local plugin edits are invisible to Claude Code until `.claude-plugin/plugin.json` `version` is bumped. Captured here and in agent memory but not enforced anywhere; first-time contributors will hit it.
- **`docs/fellowship/` serves double duty** — both the template structure scaffolded into user projects AND this repo's own workspace. When editing a file under `docs/fellowship/`, decide which role you're touching before saving.
