# Tier Scoring Reference

Scoring anchors classification. Evaluate signals before classifying — don't calculate aloud; reference signals when explaining a classification.

## Signals that push UP

| Signal | Score | Examples |
|--------|-------|---------|
| Multiple files affected | +2 | Feature spanning 3+ files |
| Touches critical path (auth, payments, data mutations, public APIs) | +3 | Auth middleware, payment webhook, database migration |
| Cross-domain (frontend + backend, or code + infrastructure) | +2 | API route + UI component + database schema |
| New feature (not fix/tweak) | +2 | New page, new API, new workflow |
| Complex logic / many edge cases | +2 | State machine, data transformation pipeline |
| User signals thoroughness ("careful", "thorough", "review this") | +2 | Explicit quality request |
| Spec exists with multiple requirements | +1 | Written plan with 5+ tasks |

## Signals that push DOWN

| Signal | Score | Examples |
|--------|-------|---------|
| Single file | -2 | One component, one config file |
| Config / copy / styling only | -3 | Tailwind classes, env var, button text |
| Clear fix with known solution | -2 | Bug with obvious cause, documented pattern |
| User signals speed ("quick", "just", "simple") | -2 | "just fix the typo" |
| Similar work done recently (pattern exists) | -1 | Second API endpoint following established pattern |
| No tests needed (pure cosmetic) | -1 | Color change, spacing adjustment |

## Thresholds

| Score | Tier | What happens |
|-------|------|-------------|
| ≤ 0 | **Tier 1 — Direct** | Gandalf handles. No agents. |
| 1–3 | **Tier 2 — One companion** | One skill or one agent dispatch. |
| 4–6 | **Tier 3 — Sequential chain** | Plan first. Gimli → Legolas → Pippin cycle. |
| ≥ 7 | **Tier 4 — Parallel / Teams** | Plan first. Parallel branches or Agent Teams. |

Scoring is a reasoning aid, not a formula. Borderline → err lower. "Quick" or "just" → Tier 1 regardless.

## Worked example

"Add auth middleware that checks session tokens" — multiple files (+2), touches auth (+3), new feature (+2), spec exists (+1) = 8. But established pattern exists (−1) = 7. Tier 4 threshold exactly — err down to Tier 3.
