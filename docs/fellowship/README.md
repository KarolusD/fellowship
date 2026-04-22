# docs/fellowship — Directory Guide

One rule per directory. Write to the right place. Move completed work to archive.

---

## `specs/` — What we're building

Formal scope and design artifacts. One file per feature.

- **PRDs** — Aragorn's requirements documents (what the feature must do, for whom, why)
- **ADRs** — Merry's architecture decision records (how the system will handle it)
- **Skill/feature specs** — any formal description of scope before execution

**Naming:** `YYYY-MM-DD-{slug}.md`
**Active work** lives at the top level of `specs/`.
**On completion** — move to `specs/archive/`.

## `plans/` — How we'll build it

Step-by-step execution plans produced by the planning skill. One file per quest.

- Who does what, in what order
- File-level tasks and ownership
- Verification checkpoints

**Naming:** `YYYY-MM-DD-{slug}-plan.md`
**On quest completion** — move to `plans/archive/`.

## `design/` — Visual and interaction artifacts

Wireframes, Figma exports, HTML/CSS mockups, screenshots, flow diagrams. Anything visual.

- One subdirectory per feature if multiple files: `design/{feature-slug}/`
- Loose files are fine for single artifacts

**Do not** sprinkle wireframes into `specs/` or `plans/`. They have a home here.

## Top-level files

- **`quest-log.md`** — current + up next + recently completed. Updated silently by Gandalf.
- **`quest-log-archive.md`** — consolidated history.
- **`product.md`** — what we're building, for whom, why. The ground truth for every dispatch.
- **`session-log.md`** — one line per session, appended by session-end hook.
- **`debug-log.md`** — Gimli-appended entries on non-obvious problems (may not exist yet).
- **`codebase-map.md`** — output of `/fellowship:map` (may not exist yet).

## Project-local skills and agents

Projects can extend Fellowship with their own skills and agents under `.claude/` in the project root:

- **`.claude/skills/{skill-name}/SKILL.md`** — project-specific skills
- **`.claude/agents/{agent-name}.md`** — project-specific agents

At session start, the Fellowship hook surveys both directories and surfaces the inventory to Gandalf via a `<PROJECT_LOCAL>` context block. **On name collision, project-local takes precedence over plugin.** If your project has a `planning` skill, the project's version is used.

Use this when the project has patterns the plugin doesn't know about — domain terminology, specific review checklists, dispatch conventions unique to the codebase.

## Other directories

- **`handoffs/`** — session-to-session handoff notes when context runs low.
- **`archive/`** — old top-level docs no longer active (distinct from specs/archive and plans/archive).
- **`examples/`** — analyses of other AI-agent systems for reference. Tracked.
- **`templates/`** — project-local templates (ethos, agent templates).

---

## Who writes where

| Agent / Source | Writes to |
|---|---|
| Aragorn (PRD) | `specs/` |
| Merry (ARD/ADR) | `specs/` |
| Planning skill | `plans/` |
| Arwen (wireframes, design contracts) | `design/` |
| Gandalf (quest log, product.md updates) | top-level files |
| Gimli | code, not docs |

If you are writing something that doesn't fit — stop and ask. Don't invent a new location.
