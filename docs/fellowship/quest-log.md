# Quest Log

**Last updated:** 2026-04-22

## Current

- [ ] Use Fellowship on a real project — validate orchestration, find gaps

## Up Next

- [ ] Pippin — eval scenario for structural duplication case (P2 acceptance dep)
- [ ] P4+P6 — Ethos migration + project-local skills (paired Sam hook work; P4: notice + /fellowship:add-ethos command)
- [ ] P5 — product.md + quest-log staleness (Gandalf edit + session-end hook; Move 3 30-day prompt deferred)
- [ ] Gimli TodoWrite-first rail — add scenario to evals (now that TodoWrite is correctly named)
- [ ] Pippin Mode 4 real validation — needs live Playwright dispatch
- [ ] Use Arwen on a Figma task (Google Doc → Figma template)

## Recently Completed
- [x] P2 shipped — Legolas structural review (Merry ADR → Gimli implementation; prefilter + responsibility test + duplication grep + map + Structural: section + anti-paralysis carve-out) (2026-04-22)
- [x] TodoWrite whitelist — all 10 agents now have TodoWrite (v1.3.2); Gandalf also has Agent(...) for fellowship dispatches (2026-04-22)
- [x] P1 + P3 shipped — TodoWrite visibility (TaskCreate naming bug fixed), docs/fellowship structure rule with README, specs/plans/design separation, 6 specs archived (v1.3.0) (2026-04-22)
- [x] Aragorn PRD — Fellowship real-usage improvements scoped, 6 problems prioritized (2026-04-22)
- [x] AutoImprove Pippin — 1.000 on 8 core scenarios; Mode 4 assertions committed, real validation deferred to live usage (2026-04-22)
- [x] Caveman analysis added to examples — composability note, security clarity invariant gap flagged (2026-04-22)
- [x] AutoImprove Gandalf — compression validated, 1.000 held, no regressions (2026-04-22)
- [x] Bootstrap ethos fix — templates/ethos.md now scaffolded on first project init (v1.2.1) (2026-04-22)
- [x] Plugin improvement batch landed — ethos template, investigate skill (100 lines), learn skill (125 lines), Gandalf compression (720→555, Legolas-reviewed, Memory section tightened post-review) (2026-04-20)
- [x] All 4 plugin audit spec improvements — debug knowledge base, plan-before-build gate, context handoff, codebase map (2026-04-12)
- [x] Browser verification — Pippin Mode 4 + Playwright MCP + Gandalf dispatch + spec (2026-04-12)
- [x] Arwen HTML/CSS wireframe fix — "What You Don't Do" scoped to application code only (2026-04-12)
- [x] Optimize context-monitor hook — removed filesystem I/O from hot path, switched to env-var debounce (2026-03-28)
- [x] Archive consolidation — 7 design docs (March 19–23) → Phase Foundation summary; old archive cleaned (2026-03-28)
- [x] AutoImprove eval hardening — judge prompt reasoning step, holdout.jsonl per agent, scenario expansion; SKILL.md updated (2026-03-28)
- [x] AutoImprove — Gimli: 0.925→1.0 across 4 cycles; eval suite hardened (2026-03-28)
- [x] Plugin audit + spec — health-check fixed (18/0), improvement spec written (2026-03-27)

## What Exists
- **Agents:** Gandalf, Aragorn (PM), Merry (Architect), Gimli (+ plan gate, debug log), Legolas, Boromir (Security), Pippin (+ browser-verify Mode 4), Arwen (Designer — HTML/CSS wireframes allowed), Sam (DevOps), Bilbo (Tech Writer)
- **Skills:** brainstorming, planning, visual-exploration, codebase-map (/fellowship:map), accessibility, ux-audit, autoimprove
- **Infrastructure:** plugin.json, settings.json, hooks (SessionStart — quest-log + product + debug-log + handoffs + codebase-map; PostToolUse context monitor; SessionEnd stamp), health-check.mjs 20/0
- **Memory:** quest log, archive, product context, session log; per-agent native memory; handoffs dir; debug-log (Gimli-written, auto-injected)
- **Docs:** research (40+ sources), reference implementations, specs (browser-verification, plugin-improvements, browser-verification)
- **Repo:** github.com/KarolusD/fellowship
