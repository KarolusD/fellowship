#!/bin/bash
# AutoImprove runner — headless agent improvement loop
#
# Usage:
#   ./improve.sh <agent>              # single agent, 25 cycles
#   ./improve.sh <agent> --cycles N   # single agent, N cycles
#   ./improve.sh --all                # sequential: Gimli → Gandalf → Legolas
#   ./improve.sh --all --cycles N     # sequential, N cycles each
#
# Examples:
#   ./improve.sh gimli
#   ./improve.sh gandalf --cycles 15
#   ./improve.sh --all --cycles 10

set -euo pipefail

# ── Argument parsing ───────────────────────────────────────────────────────────

TARGET=""
CYCLES=25
RUN_ALL=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --all)
            RUN_ALL=true
            shift
            ;;
        --cycles)
            CYCLES="${2:?--cycles requires a number}"
            shift 2
            ;;
        --*)
            echo "Unknown flag: $1" >&2
            exit 1
            ;;
        *)
            TARGET="$1"
            shift
            ;;
    esac
done

if [[ "$RUN_ALL" == false && -z "$TARGET" ]]; then
    echo "Usage: $0 <agent> [--cycles N]" >&2
    echo "       $0 --all [--cycles N]" >&2
    exit 1
fi

if [[ "$RUN_ALL" == true && -n "$TARGET" ]]; then
    echo "Error: cannot combine --all with a specific agent name." >&2
    exit 1
fi

# ── Core loop function ─────────────────────────────────────────────────────────

run_agent() {
    local agent="$1"
    local cycles="$2"
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M)
    local branch="autoimprove/${agent}-${timestamp}"
    local worktree="/tmp/fellowship-improve-${agent}"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Agent:      $agent"
    echo "  Branch:     $branch"
    echo "  Worktree:   $worktree"
    echo "  Max cycles: $cycles"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Remove stale worktree if it exists
    if [[ -d "$worktree" ]]; then
        echo "Removing existing worktree at $worktree..."
        git worktree remove "$worktree" --force 2>/dev/null || true
    fi

    # Create isolated worktree on a fresh branch
    git worktree add "$worktree" -b "$branch"

    # Run the improvement loop headlessly (cd into worktree first — no --cwd flag in claude CLI)
    (cd "$worktree" && claude --dangerously-skip-permissions --print \
        "Read skills/autoimprove/SKILL.md.
Target agent: ${agent}.
Max cycles: ${cycles}.
Run the full improvement loop.
Stop when done and write the session summary.")

    # ── Morning review instructions ────────────────────────────────────────────

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Morning review — ${agent}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Commits that held:"
    git -C "$worktree" log --oneline | grep "^exp:" || echo "  (none)"
    echo ""
    echo "Full diff against main:"
    git -C "$worktree" diff main -- "agents/${agent}.md"
    echo ""
    echo "Session summary:"
    cat "$worktree/evals/${agent}/session-summary.md" 2>/dev/null || echo "  (no summary written)"
    echo ""
    echo "To merge:"
    echo "  git merge ${branch} --no-ff"
    echo ""
    echo "To discard:"
    echo "  git worktree remove ${worktree} --force && git branch -d ${branch}"
    echo ""
}

# ── Dispatch ───────────────────────────────────────────────────────────────────

if [[ "$RUN_ALL" == true ]]; then
    echo "Starting sequential autoimprove: Gimli → Gandalf → Legolas"
    echo "Cycles per agent: $CYCLES"
    run_agent "gimli" "$CYCLES"
    run_agent "gandalf" "$CYCLES"
    run_agent "legolas" "$CYCLES"
    echo ""
    echo "All three agents complete."
else
    run_agent "$TARGET" "$CYCLES"
fi
