#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_REPO="${AGENT_ARENA_DEMO_REPO:-$ROOT_DIR/.agent-arena/demo-repo}"
PROMPT_DELAY="${AGENT_ARENA_PROMPT_DELAY:-3}"
SUBMIT_DELAY="${AGENT_ARENA_SUBMIT_DELAY:-0.4}"
DEMO_PROMPT="${AGENT_ARENA_DEMO_PROMPT:-Review this tiny repo. Add one useful test or improvement, run pnpm test, and summarize the result for the Agent Arena demo.}"

cd "$DEMO_REPO"

if [[ -n "${TMUX:-}" ]]; then
  pane_id="$(tmux display-message -p '#{pane_id}')"
  (
    sleep "$PROMPT_DELAY"
    tmux send-keys -t "$pane_id" -l "$DEMO_PROMPT"
    sleep "$SUBMIT_DELAY"
    tmux send-keys -t "$pane_id" Enter
    sleep "$SUBMIT_DELAY"
    tmux send-keys -t "$pane_id" Enter
  ) &
fi

exec codex --cd "$DEMO_REPO"
