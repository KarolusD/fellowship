# Codebase Map

**Project:** Fellowship
**Generated:** 2026-04-22
**Stack:** Claude Code plugin — Markdown agents/skills + Bash/Node hooks + Python eval runner

---

## Stack

- **Plugin runtime:** Claude Code (plugin manifest at `.claude-plugin/plugin.json`, v1.5.0)
- **Agents/skills:** Markdown files with YAML frontmatter — no compiler, loaded by Claude Code directly
- **Hooks:** Bash entry shims under `hooks/` (extensionless filenames, polyglot `run-hook.cmd` wrapper for Windows) calling Node `.mjs` workers
- **Eval runner:** Python 3 — `evals/_runner/run_eval.py` and `improve.sh`
- **Tests:** Node `node:test` runner — files under `tests/*.test.mjs`
- **Package manager:** none — no `package.json`, no `node_modules`. Use system Node (≥20 for `.mjs` test runner) and system Python.

## Architecture

A Claude Code plugin. There is no application server and no build step. The plugin manifest declares the package; Claude Code loads agents from `agents/`, skills from `skills/`, hooks from `hooks/hooks.json`, and slash commands from `commands/`. Hooks fire at `SessionStart`, `PostToolUse`, and `SessionEnd` — they shell out via `run-hook.cmd` to Bash scripts that delegate to Node `.mjs` workers for real logic.

Request flow at session start:
1. Claude Code triggers `SessionStart` → `hooks/run-hook.cmd session-start`
2. `hooks/session-start` (Bash) reads project-level `docs/fellowship/` files and emits the bootstrap context block consumed by Gandalf
3. Gandalf orchestrates; companion agents are dispatched via the `Agent` tool

Key files:
- `.claude-plugin/plugin.json` — plugin manifest (name, version)
- `.claude-plugin/marketplace.json` — marketplace registration
- `settings.json` — default agent (`fellowship:gandalf`) and statusline
- `agents/gandalf.md` — orchestrator entry point
- `hooks/hooks.json` — hook registration
- `hooks/session-start` — bootstrap context injector
- `hooks/fellowship-context-monitor.mjs` — handoff trigger when context runs low
- `hooks/health-check.mjs` — plugin self-test (run via Node)
- `evals/_runner/run_eval.py` — judge-based scenario eval driver

## Structure

    .claude-plugin/   # Plugin manifest + marketplace registration
    agents/           # 10 companion agent definitions (one .md per companion)
    skills/           # Loadable skills (one folder per skill, each contains SKILL.md)
    hooks/            # SessionStart, PostToolUse, SessionEnd hooks (Bash shims + .mjs workers)
    commands/         # Slash commands (one .md per command)
    templates/        # Boilerplate scaffolded into projects (e.g. ethos.md)
    evals/            # Per-agent eval scenarios + judge runner (Python)
    tests/            # Node test runner suites for hooks/scripts
    docs/fellowship/  # Project's own dogfooded Fellowship workspace (quest log, specs, plans)
    examples/         # External reference repos (gitignored — not shipped)
    src/              # Legacy/throwaway test fixtures (gitignored)

**Where to add new code:**
- New companion agent: `agents/[name].md` — lowercase, single file, YAML frontmatter required (`name`, `description`, `tools`, `model`, `color`, `memory`)
- New skill: `skills/[name]/SKILL.md` — folder per skill, one `SKILL.md` inside; reference via `fellowship:[name]` and invoke with `/fellowship:[name]` if a matching command exists
- New slash command: `commands/fellowship-[name].md` — filename uses hyphen, invoked as `/fellowship:[name]`
- New hook: register in `hooks/hooks.json`; entry script goes in `hooks/[name]` (extensionless Bash shim) and worker in `hooks/[name].mjs` (Node)
- New template (scaffolded into user projects): `templates/[name].md`
- New eval scenario: append a JSONL line to `evals/[agent]/scenarios.jsonl`; holdout cases go in `evals/[agent]/holdout.jsonl`
- New test: `tests/[name].test.mjs` — uses `node:test`
- Fellowship's own workspace artifacts (quest log, specs, plans for *this* repo): `docs/fellowship/`

## Conventions

**Naming:**
- Agent files: lowercase companion name, `.md` (`gimli.md`, not `Gimli.md`)
- Skill folders: lowercase kebab-case (`codebase-map`, `visual-exploration`); the file inside is always `SKILL.md` (uppercase)
- Slash commands: `fellowship-[name].md` on disk → `/fellowship:[name]` at the prompt
- Hook scripts: extensionless Bash shim (`session-start`, not `session-start.sh`) — Claude Code's Windows path auto-prepends `bash` when it sees `.sh`, so the extension is omitted on purpose. Worker script is `[name].mjs` next to the shim.
- Node scripts: `.mjs` (ESM only — there is no `package.json` declaring `"type": "module"`)
- Versioning: semver in `.claude-plugin/plugin.json` — bump on every shipped change. Local plugin changes are invisible to Claude Code until the version field changes (cache-bust).

**Agent frontmatter (required for every `agents/*.md`):**
```yaml
---
name: fellowship:[lowercase-name]
description: [one paragraph + examples block — see existing agents]
tools: [YAML list — see tool semantics below]
model: inherit | sonnet | opus | haiku
color: red | orange | yellow | green | blue | purple | cyan   # gray | magenta | pink are NOT valid
memory: project
---
```

**`tools:` field semantics (load-bearing — get this wrong and the agent silently loses access):**
- The `tools:` field is a **strict allowlist** when declared. Listed tools are the ONLY tools the agent can use, including built-ins like TodoWrite, Glob, Grep.
- **If `tools:` is omitted entirely, the agent inherits all available tools** (Anthropic's own `plugin-dev`/`agent-sdk-dev` agents and Superpowers all use this pattern).
- Fellowship's choice: declare explicitly for principle of least privilege. This is valid only if the list is kept complete. When adding a new built-in tool to the workflow, every agent that should use it must list it.
- **Built-in Claude Code tools to consider for each agent:** Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, TodoWrite, Task. Plus `Agent(...)` for orchestrators.
- **Intentional restrictions** are valid and important: Boromir (read-only audit) omits Write/Edit on purpose; Legolas (review only) does the same. These are principled, not bugs.
- Project-level `.claude/settings.json` `permissions.allow` controls *prompt-confirmation* for tool use — it does NOT grant tools to an agent that doesn't list them in `tools:`. The agent allowlist is enforced at dispatch, before permissions are checked.

Source: Anthropic's `plugin-dev/skills/agent-development/SKILL.md` (canonical contract).

**Skill frontmatter (required for every `SKILL.md`):**
```yaml
---
name: [name]
description: [when to use this skill]
---
```

**Hook conventions:**
- Always go through `run-hook.cmd` from `hooks.json` — never invoke `.mjs` files directly. The polyglot wrapper handles Windows.
- Bash shim does I/O setup; Node `.mjs` does the logic. Keep the shim short.
- Hooks must exit 0 on missing dependencies (graceful degradation). The Windows path silently exits 0 when Bash isn't found — match that contract.

**Voice/character:**
- Companion responses (in agent `.md` files) carry their character voice. Gandalf's register is documented in `agents/gandalf.md` — study it before editing any other companion.
- Artifacts (specs, plans, code, structured output) stay clean and clear — no character voice in produced files.

## Concerns

- **Two files named `plugin.json`** — `/plugin.json` (root) holds *permissions* (it is functionally a `settings.json`), while `/.claude-plugin/plugin.json` is the real plugin manifest with version. Confusing on first read; root file's name should be `permissions.json` or merged into `settings.json`. Editing either without realizing the other exists is a real risk.
- **No `package.json`** — Node hooks rely on system Node and ESM-only `.mjs`. Adding a dependency means either keeping it dependency-free or introducing a `package.json`, which would change the install story. Worth a deliberate decision before any Node script reaches for an npm package.
- **Cache-bust requirement undocumented at the file level** — local plugin edits are invisible until `.claude-plugin/plugin.json` `version` is bumped. Captured in agent memory but not in the manifest itself; first-time contributors will hit this.
- **Quest-log regex edge case** — `hooks/fellowship-session-end.mjs` won't match the `## Current` section if it is the last section in the quest log (Sam previously flagged, non-fatal). Tracked in the live quest log under "Up Next."
- **`src/` and `examples/` are gitignored** — `src/__tests__/email.test.ts` looks like a leftover fixture rather than load-bearing code. Confirm before relying on it.
- **`docs/fellowship/` serves double duty** — it is both the *template structure* the plugin scaffolds into user projects AND this repo's own dogfooded workspace. When editing a file under `docs/fellowship/`, decide which role you're touching before saving.
