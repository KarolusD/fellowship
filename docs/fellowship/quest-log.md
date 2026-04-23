# Quest Log

**Last updated:** 2026-04-23

## Current

- [ ] Use Fellowship on a real project — validate orchestration, find gaps
- [ ] Eval coverage for Boromir/Merry/Aragorn/Arwen/Sam/Bilbo (deferred from cleanup pass — separate quest)

## Up Next

- [ ] Pippin — eval scenario for structural duplication case (P2 acceptance dep)
- [ ] Gimli TodoWrite-first rail — add scenario to evals (now that TodoWrite is correctly named)
- [ ] Pippin Mode 4 real validation — needs live Playwright dispatch
- [ ] Use Arwen on a Figma task (Google Doc → Figma template)
- [ ] Session-end quest-log regex edge case — won't match if `## Current` is the last section (Sam flagged, non-fatal)

## Recently Completed
- [x] Full-codebase Legolas health-check pass — Legolas APPROVED_WITH_CONCERNS (1 Important, 5 Minor); Gimli fixed all six (dead context-monitor debounce → tmpfile; marketplace.json 1.0.0→1.7.0; dead statusline bridge-file write removed; orphan auth-login test deleted; Task added to KNOWN_TOOLS; product.md H1 heuristic widened); Legolas re-review APPROVED with one stale-comment nit, fixed inline (2026-04-23)
- [x] Agent tool allowlists corrected v1.7.0 — Sam round-3 research nailed the mechanism (`tools:` is strict allowlist; omit → inherit all; built-ins like TodoWrite governed same as everything else); fixed Aragorn (+Edit), Merry (+Edit), Sam (+WebFetch/+WebSearch), Gimli (+WebFetch/+WebSearch), Bilbo (+WebFetch/+WebSearch); codebase-map updated with canonical `tools:` semantics; .claude/settings.json TodoWrite addition kept (benign, not load-bearing) (2026-04-23)
- [x] Quest-log auto-consolidation v1.6.1 — Merry ADR (parse contract + edit safety + archive schema) → Gimli hook (`fellowship-quest-log-consolidate.mjs` + Bash shim + slash command, archive-first/atomic-write/fail-silent, dual-mode invocation, 10s safety timeout) wired to SessionStart + SessionEnd; pre-existing session-end `writeFileSync` swapped to `appendFileSync`; Legolas APPROVED clean across two cycles (2026-04-22)
- [x] Codebase cleanup v1.5.1 — Critical (TodoWrite in KNOWN_TOOLS) + 5 Important (SessionEnd shim, Gandalf color, model: inherit ×9, autoimprove frontmatter, stale test) + 1 Minor (pipefail guard); Legolas APPROVED clean (2026-04-22)
- [x] Codebase map generated — `/fellowship:map` (2026-04-22)
- [x] P4+P5+P6 shipped — ethos absence notice, project-local skills survey, quest-log consolidation reminder, /fellowship:add-ethos command, Gandalf product.md triggers + Project-Local section (v1.5.0) (2026-04-22)
- [x] P2 shipped — Legolas structural review (Merry ADR → Gimli implementation; prefilter + responsibility test + duplication grep + map + Structural: section + anti-paralysis carve-out) (2026-04-22)

## What Exists
- **Agents:** Gandalf, Aragorn (PM), Merry (Architect), Gimli (+ plan gate, debug log), Legolas, Boromir (Security), Pippin (+ browser-verify Mode 4), Arwen (Designer — HTML/CSS wireframes allowed), Sam (DevOps), Bilbo (Tech Writer)
- **Skills:** brainstorming, planning, visual-exploration, codebase-map (/fellowship:map), accessibility, ux-audit, autoimprove
- **Infrastructure:** plugin.json, settings.json, hooks (SessionStart — quest-log + product + debug-log + handoffs + codebase-map + auto-consolidate; PostToolUse context monitor; SessionEnd stamp + auto-consolidate), `/fellowship:consolidate` slash command, health-check.mjs 22/0
- **Foundations (consolidated 2026-04-22):** plugin improvement batch (ethos template, investigate/learn skills, Gandalf compression); browser verification (Pippin Mode 4 + Playwright); Arwen wireframe scope fix; debug knowledge base + plan-before-build gate + context handoff + codebase map; context-monitor hot-path optimization; AutoImprove eval hardening (judge reasoning, holdout files); AutoImprove Gimli 1.0; plugin audit + health-check 18/0
- **Memory:** quest log, archive, product context, session log; per-agent native memory; handoffs dir; debug-log (Gimli-written, auto-injected)
- **Docs:** research (40+ sources), reference implementations, specs (browser-verification, plugin-improvements, browser-verification)
- **Repo:** github.com/KarolusD/fellowship
