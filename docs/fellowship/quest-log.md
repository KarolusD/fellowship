# Quest Log

**Last updated:** 2026-04-26

## Current

- [ ] **TodoWrite not actually wired up for Gandalf — v1.0 BLOCKER.** Runtime returns `"TodoWrite exists but is not enabled in this context"` when Gandalf attempts the call. Plugin claims (v1.7.0 release notes) that TodoWrite was whitelisted across all ten agents; reality says no for Gandalf at least. Every Tier 3+ orchestration since v1.7.0 has silently skipped the live checklist. Investigation: `agents/gandalf.md` `tools:` line, plugin manifest, default-agent allowlist resolution at session start.
- [ ] Use Fellowship on a real project — validate orchestration, find gaps
- [ ] Eval coverage for Boromir/Merry/Aragorn/Arwen/Sam/Bilbo (deferred from cleanup pass — separate quest)

## Up Next

- [ ] Aragorn pre-publication copy fixes (~1 hr): rewrite top-level descriptions in plugin.json + marketplace.json; add "On First Run" subsection to README; add validation-gap honesty note to README Status section
- [ ] Bump `version` in `marketplace.json` to `1.0.0` at the public-launch commit; tag `v1.0.0` GitHub release
- [ ] Pippin — eval scenario for structural duplication case (P2 acceptance dep)
- [ ] Gimli TodoWrite-first rail — add scenario to evals (now that TodoWrite is correctly named)
- [ ] Pippin Mode 4 real validation — needs live Playwright dispatch
- [ ] Use Arwen on a Figma task (Google Doc → Figma template)
- [ ] Session-end quest-log regex edge case — won't match if `## Current` is the last section (Sam flagged, non-fatal)
- [ ] Pippin section heading: "Three Modes" → "Four Modes" (file documents four; pre-existing inconsistency surfaced during 2026-04-25 adoption pass)
- [ ] Tier 4 utilization audit — Karolus flagged Fellowship rarely reaches Tier 4 in practice; default conservativism may be over-tuned
- [ ] Re-evaluate `improve-codebase-architecture` post-1.0 — substantive Matt Pocock skill deferred; needs Aragorn scoping pass on whether to adopt the CONTEXT.md domain-glossary pattern alongside it

## Recently Completed
- [x] Three skills adopted from mattpocock/skills (v0.7.x) — `grill-me` standalone (4-line interview posture); `design-it-twice` for Merry (renamed from `design-an-interface` for "interface" overload, parallel-dispatch rewritten for Fellowship's Tier 4 pattern, Ousterhout + Matt attribution); TDD principles surgically folded into Pippin (mode-agnostic public-interface principle in First Principle; four test-first rules in Mode 2 only; no bleed). Skipped: caveman (voice conflict), write-a-skill (low end-user value). Deferred: improve-codebase-architecture. Legolas APPROVED clean. Health check 25/0. (2026-04-25)
- [x] v0.7.0 pre-publication prep — Aragorn readiness review + Sam publishing-mechanics research; version reset (1.7.0 → 0.7.0, plugin.json `version` field removed per Claude Code's relative-path-plugin convention); top-level descriptions rewritten; README "On First Run" + status honesty note; health-check updated (now asserts marketplace.json semver). (2026-04-25)
- [x] Full-codebase Legolas health-check pass — Legolas APPROVED_WITH_CONCERNS (1 Important, 5 Minor); Gimli fixed all six (dead context-monitor debounce → tmpfile; marketplace.json 1.0.0→1.7.0; dead statusline bridge-file write removed; orphan auth-login test deleted; Task added to KNOWN_TOOLS; product.md H1 heuristic widened); Legolas re-review APPROVED with one stale-comment nit, fixed inline (2026-04-23)
- [x] Agent tool allowlists corrected v1.7.0 — Sam round-3 research nailed the mechanism (`tools:` is strict allowlist; omit → inherit all; built-ins like TodoWrite governed same as everything else); fixed Aragorn (+Edit), Merry (+Edit), Sam (+WebFetch/+WebSearch), Gimli (+WebFetch/+WebSearch), Bilbo (+WebFetch/+WebSearch); codebase-map updated with canonical `tools:` semantics; .claude/settings.json TodoWrite addition kept (benign, not load-bearing) — NOTE: this premise is now questioned by the v1.0 blocker investigation (2026-04-23)
- [x] Quest-log auto-consolidation v1.6.1 — Merry ADR (parse contract + edit safety + archive schema) → Gimli hook (`fellowship-quest-log-consolidate.mjs` + Bash shim + slash command, archive-first/atomic-write/fail-silent, dual-mode invocation, 10s safety timeout) wired to SessionStart + SessionEnd; pre-existing session-end `writeFileSync` swapped to `appendFileSync`; Legolas APPROVED clean across two cycles (2026-04-22)
- [x] Codebase cleanup v1.5.1 — Critical (TodoWrite in KNOWN_TOOLS) + 5 Important (SessionEnd shim, Gandalf color, model: inherit ×9, autoimprove frontmatter, stale test) + 1 Minor (pipefail guard); Legolas APPROVED clean (2026-04-22)
- [x] Codebase map generated — `/fellowship:map` (2026-04-22)
- [x] P4+P5+P6 shipped — ethos absence notice, project-local skills survey, quest-log consolidation reminder, /fellowship:add-ethos command, Gandalf product.md triggers + Project-Local section (v1.5.0) (2026-04-22)

## What Exists
- **Agents:** Gandalf, Aragorn (PM), Merry (Architect), Gimli (+ plan gate, debug log), Legolas (+ structural review v2026-04-22), Boromir (Security), Pippin (+ browser-verify Mode 4, + folded TDD principles), Arwen (Designer — HTML/CSS wireframes allowed), Sam (DevOps), Bilbo (Tech Writer)
- **Skills:** brainstorming, planning, visual-exploration, codebase-map (/fellowship:map), accessibility, ux-audit, autoimprove, grill-me, design-it-twice, investigate, learn
- **Infrastructure:** plugin.json (v0.7.0), marketplace.json, settings.json, hooks (SessionStart — quest-log + product + debug-log + handoffs + codebase-map + auto-consolidate; PostToolUse context monitor; SessionEnd stamp + auto-consolidate), `/fellowship:consolidate` slash command, health-check.mjs 25/0
- **Foundations (consolidated 2026-04-22):** plugin improvement batch (ethos template, investigate/learn skills, Gandalf compression); browser verification (Pippin Mode 4 + Playwright); Arwen wireframe scope fix; debug knowledge base + plan-before-build gate + context handoff + codebase map; context-monitor hot-path optimization; AutoImprove eval hardening (judge reasoning, holdout files); AutoImprove Gimli 1.0; plugin audit + health-check 18/0
- **Memory:** quest log, archive, product context, session log; per-agent native memory; handoffs dir; debug-log (Gimli-written, auto-injected)
- **Docs:** research (40+ sources), reference implementations, specs (browser-verification, plugin-improvements, browser-verification), examples/mattpocock-skills/ (gitignored reference clone)
- **Repo:** github.com/KarolusD/fellowship
