#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVENTS_PATH="${AGENT_ARENA_EVENTS_PATH:-.agent-arena/live/events.jsonl}"
LOWER_COMMAND="${AGENT_ARENA_LOWER_COMMAND:-codex}"
VIEW="${AGENT_ARENA_VIEW:-scene}"
MODE="${AGENT_ARENA_MODE:-solo}"

cd "$ROOT_DIR"

if [[ -z "${TMUX:-}" ]]; then
  echo "This demo script must be run inside tmux." >&2
  echo "Start tmux first, then run: pnpm demo:tmux-live" >&2
  exit 1
fi

mkdir -p "$(dirname "$EVENTS_PATH")"
rm -f "$EVENTS_PATH"

(
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type agent_started --label "Codex live session started" >/dev/null
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type tool_used --label "read spec" >/dev/null
  if [[ "$MODE" == "race" ]]; then
    sleep 1
    pnpm arena emit --events "$EVENTS_PATH" --agent claude --type test_failed --label "lint failed" >/dev/null
  fi
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type subagent_spawned --label "test helper" >/dev/null
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type test_passed --label "unit tests passed" >/dev/null
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type build_passed --label "production build passed" >/dev/null
  sleep 1
  pnpm arena emit --events "$EVENTS_PATH" --agent codex --type task_completed --label "feature delivered" >/dev/null
) &

if [[ "$MODE" == "solo" ]]; then
  pnpm arena live --events "$EVENTS_PATH" --view "$VIEW" --solo codex -- "$LOWER_COMMAND"
else
  pnpm arena live --events "$EVENTS_PATH" --view "$VIEW" -- "$LOWER_COMMAND"
fi
