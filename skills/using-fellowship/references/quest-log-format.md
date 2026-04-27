# Quest Log Format

```markdown
# Quest Log

**Last updated:** YYYY-MM-DD

## Current
<!-- 1-3 items. Full detail. "Where am I now?" -->
- [ ] [What's being worked on] — [context]

## Up Next
<!-- 5-7 items. Ordered by priority. -->
- [ ] [What's coming next]

## Recently Completed
<!-- Last 7 items. One line each. Newest first. -->
<!-- When this exceeds 7, consolidate oldest into What Exists -->
- [x] [What was done] (YYYY-MM-DD)

## What Exists
<!-- Consolidated summary of what's been built. Architectural context. -->
<!-- "Agents: Gandalf, Gimli" not "Built Gimli on March 22 with 7 principles" -->
- **Category:** [what exists]
```

## Consolidation rule

Run before every write. Count items in Recently Completed. If more than 7:

1. Move oldest to `docs/fellowship/quest-log-archive.md` (append, don't overwrite).
2. Fold them into a single summary line in What Exists.
3. Then write your new entry.

If What Exists exceeds 15 lines, group related items. Never skip this check — a quest log that grows without bound defeats itself.
