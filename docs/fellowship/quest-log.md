# Quest Log

**Last updated:** 2026-05-12

## Open

Decisions and commitments that survive across sessions. One line per entry, dated.

- [ ] **Use Fellowship on a real project — validate orchestration, find gaps.** Reason it stays: the only way to surface live-usage friction the eval suite can't catch.
- [ ] **v1.1 — end-to-end orchestration fixture.** Sample project (Go/Svelte-style per Superpowers) that exercises the full Gandalf→companion flow. Per-companion evals can't catch orchestration regressions. (Merry vs Superpowers §7, 2026-04-27)
- [ ] **v1.1 — hook unit tests.** `fellowship-plan-gate.mjs`, `fellowship-context-monitor.mjs`, `fellowship-session-end.mjs`, `fellowship-quest-log-consolidate.mjs` are untested at the script level — 4× the hook surface vs Superpowers. (Merry vs Superpowers §1, 2026-04-27)
- [ ] **v1.1 — plan-mode entry-point wiring.** No EnterPlanMode→brainstormed gate; Superpowers handles this at `using-superpowers/SKILL.md:46-74`. (Merry vs Superpowers §5, 2026-04-27)
- [ ] **v1.1 — per-companion tier-roles matrix.** Wave 2 removed Tier-positions sections from 5 agents for uniformity; the cross-tier sequencing overview now has no home. Add `references/tier-roles.md` with a "When dispatched at each tier" matrix. (Gimli Wave 2 concern #3, 2026-04-27)
- [ ] **v1.1 — Pippin SF-2 test for `<UNTRUSTED_*>` 8KB cap + truncation marker.** Boundary exists, no test exercises the cap. (Gimli Wave 2 concern #4, 2026-04-27)
- [ ] **Skill naming convention — verbs vs nouns inconsistent.** `brainstorming`, `planning` (verbs) vs `accessibility`, `ux-audit` (nouns). Needs a design call. (Legolas finding, deferred 2026-04-27)
- [ ] **Orphan-domain routing.** Performance, dependency-bumps, schema migrations have no documented owner. Frodo decision: assign vs judgment. (Legolas finding, deferred 2026-04-27)
- [ ] **Three agent files under -25% target on the bloat refactor.** Aragorn (-7%), Bilbo (-12%), Merry (-8%); craft methodology preserved per restraint rule. Re-evaluate if files prove unwieldy. (2026-04-27)
- [ ] **Tier 4 utilization audit.** Frodo flagged Fellowship rarely reaches Tier 4 in practice; default conservativism may be over-tuned. (2026-04-27)
- [ ] **Re-evaluate `improve-codebase-architecture` post-1.0.** Substantive Matt Pocock skill deferred; needs Aragorn scoping pass on adopting the CONTEXT.md domain-glossary pattern alongside it. (2026-04-25)
- [ ] **Use Arwen on a Figma task** (Google Doc → Figma template) — first live design dispatch.
- [ ] **Pippin Mode 4 real validation.** Needs live Playwright dispatch.
- [ ] **Quest-log redesign 2026-05-12 — decisions in, commits out.** Single `## Open` section; `## Recently Completed` and `## What Exists` retired (git log and codebase-map carry those). Skill rule rewritten in `skills/using-fellowship/SKILL.md`. Reason: the old structure relied on voluntary discipline and was being silently skipped — see conversation 2026-05-12.
- [ ] **Codebase-map staleness signal landed 2026-05-12.** SessionStart hook now compares map mtime against git activity and surfaces a notice when the map is likely stale. No auto-regeneration — assistant decides. Reason: stale map silently misleads Legolas and Gimli on dispatch.
- [ ] **Slash-namespace consistency fix 2026-05-12.** All skills set `user-invocable: false`; `trigger:` field removed (verified as no-op); commands/X.md shims added for `learn`, `ux-audit`, `accessibility`. Reason: bare `/learn` and `/ux-audit` were leaking the plugin namespace; Anthropic docs confirm `commands/` shims are the canonical pattern.
- [ ] **`/fellowship:map` no longer asks "say the word" 2026-05-12.** Skill rewritten to begin generation immediately when loaded via slash command. Reason: typing the slash IS the confirmation; the second prompt was friction.
