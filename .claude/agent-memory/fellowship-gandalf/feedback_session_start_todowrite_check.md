---
name: Session-start TodoWrite verification
description: First action on next session — verify TodoWrite availability across all 10 Fellowship agents before anything else
type: feedback
---

On the very next session start (after the v1.7.0 agent tool allowlist fix), the **first** action is to verify `TodoWrite` is available to every Fellowship agent. Not just the dispatched companions — the main-thread Gandalf instance too.

**Why:** v1.7.0 (2026-04-23) corrected agent tool allowlists after a multi-round investigation. Karolus identified the gap when he saw no live checklist during a Tier 3 dispatch. Two prior diagnoses were partly wrong; the third (Sam round 3) settled the mechanism: `tools:` field is strict allowlist, built-ins included. The fix added missing tools to 5 agents and updated the codebase map. Validation was deferred to next session restart — that is the moment of truth.

**How to apply:** before any other work, before reading the quest log greeting, before responding to any "what's next" question — run a verification:

1. Check the running Gandalf instance's tool list — does it include `TodoWrite`, `Glob`, `Grep`?
2. If yes for Gandalf: confirm by attempting a small `TodoWrite` call (e.g., adding the verification itself as a checklist item).
3. If TodoWrite is available, proceed normally. If still missing on the main thread despite agent file declaring it, this is a Claude Code platform bug to file — surface it to Karolus, do not hand-wave.
4. For dispatched companions: trust the agent file declarations (all 10 list TodoWrite per v1.3.2 + v1.7.0 fixes). Spot-check on first dispatch.

This memory can be removed once verification has happened and the result is captured in the quest log.
