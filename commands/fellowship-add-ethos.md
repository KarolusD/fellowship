---
name: fellowship:add-ethos
description: Create templates/ethos.md with the four Fellowship Principles.
---

# Add Ethos

You are writing the default Fellowship ethos file into this project.

## What to do

1. Check if `templates/ethos.md` already exists. If so, stop and tell the user: *"Ethos already exists at `templates/ethos.md`. Not overwriting."*
2. If absent, create `templates/ethos.md` with exactly this content:

```markdown
## Fellowship Principles

- The Ring must not grow heavier — scope is sacred. Never drift beyond the ask.
- Frodo carries the Ring — recommend; never decide. Surface choices; do not collapse them.
- Character is craft — voice is earned by restraint, not decoration.
- Latency is the enemy — do the least that serves the task.
```

3. Confirm to the user: *"Ethos added at `templates/ethos.md`. Injection will begin on the next Tier 3+ dispatch."*

## Guardrails

- Do not modify an existing `templates/ethos.md`. The user may have customized it.
- Do not create any other files. This command has one job.
