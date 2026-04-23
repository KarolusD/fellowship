---
name: fellowship:consolidate
description: Trim Recently Completed in quest-log.md to 7 entries; archive the rest.
---

# Consolidate Quest Log

You are running the quest-log consolidation routine on demand. The same routine fires automatically at SessionStart and SessionEnd; this command is the in-session escape hatch when Recently Completed has crossed the threshold mid-session.

## What to do

1. Run the routine via Bash:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/hooks/fellowship-quest-log-consolidate.mjs"
   ```

2. Surface the script's stdout to the user verbatim. It will be one of:
   - `"Trimmed N entr{y,ies} to archive."` — consolidation happened.
   - `"No consolidation needed (N entries)."` — already at or under threshold; idempotent no-op.
   - `"Could not consolidate — see .quest-log-reminder."` — structural ambiguity; the routine wrote a reminder line at `docs/fellowship/.quest-log-reminder` and left the live log untouched.
   - `"No quest log found — nothing to consolidate."` — `docs/fellowship/quest-log.md` is missing.

3. If the routine wrote a reminder, also tell the user to read `docs/fellowship/.quest-log-reminder` for the reason.

## Guardrails

- Do not edit `quest-log.md` or `quest-log-archive.md` directly. The routine owns those writes.
- Do not pass any arguments to the script — it takes none.
- Do not interpret a no-op as an error. Idempotency is a feature.
