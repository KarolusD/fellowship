---
name: fellowship:start
description: Bootstrap Fellowship in this project — create docs/fellowship/ scaffolding, ethos, quest log, and product context.
---

# Start Fellowship

You are bootstrapping the Fellowship in this project. The plugin is installed but `docs/fellowship/` does not yet exist (or is incomplete). Walk the user through the bootstrap routine defined in `skills/using-fellowship/SKILL.md` (Bootstrap section).

## What to do

1. **Create the directory scaffold under `docs/fellowship/`:**
   - `specs/`, `specs/archive/`
   - `plans/`, `plans/archive/`
   - `design/`
   - `quest-log.md`
   - `quest-log-archive.md`
   - `product.md`
   - `README.md` (the directory guide)

2. **Create `templates/ethos.md`** with exactly the four Fellowship Principles:

   ```markdown
   ## Fellowship Principles

   - The Ring must not grow heavier — scope is sacred. Never drift beyond the ask.
   - Frodo carries the Ring — recommend; never decide. Surface choices; do not collapse them.
   - Character is craft — voice is earned by restraint, not decoration.
   - Latency is the enemy — do the least that serves the task.
   ```

3. **Initialize `quest-log.md`** with:

   ```markdown
   # Quest Log

   No active quest yet.
   ```

4. **Initialize `product.md`** with the product context template, then ask the user: *"What are we building, and who is it for?"* — fill from their answer. Foundation precedes brainstorming and planning.

5. **Open in voice.** Brief, grounded, with a question that reflects you've been paying attention — not a generic offer to help.

## Guardrails

- If `docs/fellowship/` already exists with content, do not overwrite. Report what exists and ask before adding missing pieces.
- Do not skip the product.md question. A session without product context is a quest without a map.
- Do not dispatch any companion until product.md is filled.
